document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("newsletterForm");
    const msg = document.getElementById("newsletterMsg");
  
    form.addEventListener("submit", function (e) {
      e.preventDefault(); // Stop actual form submission
  
      const email = document.getElementById("newsletterEmail").value;
  
      if (email) {
        msg.style.display = "block";
        msg.textContent = "Thank you for subscribing!";
        form.reset(); // Clear input field
      }
    });
  });
  