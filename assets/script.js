document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    submitButton.innerText = 'Uploading...';

    const formData = new FormData(this);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
            // Handle JSON response
            const data = await response.json();
            // Update the paragraph element with the unique link
            document.getElementById('links').textContent = `https://nutcracker.live/tmp/${data.link}`;
        } else {
            // Handle plain text response
            const data = await response.text();
            // Display the plain text response
            document.getElementById('links').textContent = data;
        }
    } catch (error) {
        console.error('Error:', error);
        console.log('Error:', error);
        // Handle errors
    }finally {
        submitButton.innerText = 'Upload'; 
    }
});
