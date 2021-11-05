const axios = require('axios');
const puppeteer = require('puppeteer');

const Sentry = require("@sentry/node");
require("@sentry/tracing");

Sentry.init({
  dsn: "https://c3e2c4a56d9a405f94a016a87f692319@o1043576.ingest.sentry.io/6034885",
  environment: 'development',
  tracesSampleRate: 1.0,
});

const frontendHealthCheckUri = "http://localhost:3002/healthcheck";
const backendHealthCheckUri =  "http://localhost:3001/healthcheck";
const ssrFrontendHealthCheckUri =  "http://localhost:3000/api/healthcheck";

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function getStringBetween(str, start, end) {
  const result = str.match(new RegExp(start + "(.*)" + end));

  return result[1];
}

const checkBackend = async () => {
  try {
    const { data } = await axios.get(backendHealthCheckUri);

    return data; 
  } catch (exception) {
    Sentry.captureException(exception, {
      extra: {
        message: `Couldn't GET backend's /healthcheck`
      },
      level: Sentry.Severity.Fatal,
      tags: {
        'backend-down': true
      },
    });

    return { is_healthy: false };
  }
};

const checkSSRFrontend = async () => {
  try {
    const { data } = await axios.get(`${ssrFrontendHealthCheckUri}`);

    return data; 
  } catch ({ name, message, stack }) {
    const error = {
      title: `Couldn't GET ssr-frontend's /healthcheck, sending fatal error to Sentry`,
      ...{ name, message, stack },
    };
    console.log(error);
    // Sentry.captureException(error, { level: Sentry.Severity.Fatal });

    return { is_healthy: false };
  }
};

const checkFrontEnd = async () => {
  /*
    Since we're requesting HTML from a SPA, we need to render the HTML here using puppeteer.
    This can't be done only using axios.
  */
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
  
    await page.goto(frontendHealthCheckUri);
    await page.waitForSelector('#root');
  
    const body = await page.evaluate(() => document.querySelector('#root').innerHTML);
  
    await browser.close();
  
    const frontendResponse = getStringBetween(body, '<div>', '</div>');
  
    return JSON.parse(frontendResponse); 
  } catch (error) {
    // Sentry.captureException(error, {
    //   level: Sentry.Severity.Fatal,
    //   extra: `Couldn't GET spa-frontend's /healthcheck, sending fatal error to Sentry`
    // });

    return { is_healthy: false };
  }
}

(async function monitorApps () {
  let i = 0;

  while(true) {

    const applications = new Map([
      ['backend', checkBackend],
      ['spa-frontend', checkFrontEnd],
      ['ssr-frontend', checkSSRFrontend],
    ]);

    const responses = [];

    for (const [application, healthcheck] of applications) {
      const response = await healthcheck();

      responses.push({ application, ...response });
    }

    const failedResponses = responses.filter(r => r.is_healthy === false);
    failedResponses.forEach(f => console.log(`${f.application} is not healthy`));
    
    console.log('run: ', i);
    responses.forEach(r => console.log(r));
    console.log('\n');

    i++;
    sleep(5000);
  }
})(); 