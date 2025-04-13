const patterns = {
  nin: /\b[A-Z]{2}\d{6}[A-Z]?\b/g, 
  phoneNumber: /\b(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/g, 
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
  address: /\b\d+\s[A-Za-z]+\s[A-Za-z]+(?:,\s[A-Za-z]+)?\b/g , 
  postcode: /\b[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}\b/g 
};

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.method === "POST" || details.method === "GET") {
      let requestBody = details.requestBody ? JSON.stringify(details.requestBody) : "";
      for (const pattern of Object.values(patterns)) {
        if (pattern.test(requestBody)) {
          console.log("Potential sensitive data detected in a request.");
          return;  
        }
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);
