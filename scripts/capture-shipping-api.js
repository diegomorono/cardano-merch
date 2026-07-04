const puppeteer = require('puppeteer');

async function main() {
  console.log("====================================================");
  console.log("POPCUSTOMS INTERNAL SHIPPING API INTERCEPTOR TOOL");
  console.log("====================================================");
  console.log("\n1. Launching visible browser session...");
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Set up network interception listeners
  page.on('requestfinished', async (request) => {
    const url = request.url();
    const method = request.method();
    
    // Filter for common shipping/rates endpoint patterns
    if (url.includes('shipping') || url.includes('rates') || url.includes('delivery')) {
      console.log(`\n[INTERCEPTED] ${method} -> ${url}`);
      
      const headers = request.headers();
      if (headers['authorization']) {
        console.log(`  Authorization: ${headers['authorization']}`);
      }
      
      const postData = request.postData();
      if (postData) {
        console.log(`  Payload: ${postData}`);
      }
      
      try {
        const response = await request.response();
        if (response) {
          const text = await response.text();
          console.log(`  Response (Truncated): ${text.substring(0, 300)}...`);
        }
      } catch (e) {
        // Response body might be empty or unreadable
      }
    }
  });

  console.log("2. Navigating to POPCustoms portal. Please log in...");
  await page.goto('https://i.popcustoms.com/login');
  
  console.log("\nINSTRUCTIONS:");
  console.log("  a. Log into your POPCustoms partner account in the browser window.");
  console.log("  b. Go to Orders -> Create Order (Draft Order).");
  console.log("  c. Add a product to the order and input a shipping address.");
  console.log("  d. Toggle between different countries (e.g. US, Spain, Mexico).");
  console.log("  e. Look at this console to see the intercepted API endpoints!");
  console.log("\nKeeping browser open. Close the browser window to exit the script.");
  
  browser.on('disconnected', () => {
    console.log("\nBrowser closed. Exiting tool.");
    process.exit(0);
  });
}

main().catch(console.error);
