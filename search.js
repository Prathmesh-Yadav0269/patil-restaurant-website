function filterMenu() {
    console.log("Search triggered"); // Check in browser console
  
    const input = document.getElementById("searchInput").value.toLowerCase();
    const items = document.querySelectorAll(".menu .item");
  
    items.forEach(item => {
      const name = item.querySelector("h3").textContent.toLowerCase();
      if (name.includes(input)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }
  