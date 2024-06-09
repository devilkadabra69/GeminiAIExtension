document.getElementById('helpBtn').addEventListener('click', () => {
    const query = document.getElementById('query').value.trim();
    if (!query) {
        alert("Empty field");
        return;
    }

    chrome.runtime.sendMessage({ prompt: query }, function (response) {
        console.log('Response received in popup:', response);
        if (response.error) {
            document.getElementById('result').innerText = response.error;
        } else {
            console.log("response from script.js ::\n", response);
            document.getElementById('result').innerText = response.response;
        }
    });
});

