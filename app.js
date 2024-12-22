// Helper function to load data from localStorage or initialize empty data
function loadData() {
  const storedMedicines = localStorage.getItem('medicinesData');
  const storedDrawers = localStorage.getItem('drawersData');

  if (storedMedicines) {
    medicinesData = JSON.parse(storedMedicines);
  } else {
    medicinesData = [];
  }

  if (storedDrawers) {
    drawersData = JSON.parse(storedDrawers);
  } else {
    drawersData = [
      { drawerNumber: "1", currentWeight: 0, capacity: 1000 },
      { drawerNumber: "2", currentWeight: 0, capacity: 1500 },
      { drawerNumber: "3", currentWeight: 0, capacity: 2000 },
    ];
  }

  populateDrawerDropdown();
}

// Save the updated data to localStorage
function saveData() {
  localStorage.setItem('medicinesData', JSON.stringify(medicinesData));
  localStorage.setItem('drawersData', JSON.stringify(drawersData));
}

// Helper function to populate the "Choose Drawer" dropdown
function populateDrawerDropdown() {
  const drawerSelect = document.getElementById("drawerSelect");

  if (!drawerSelect) {
    console.error("Dropdown element with ID 'drawerSelect' not found.");
    return;
  }

  drawerSelect.innerHTML = ""; // Clear existing options

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Drawer";
  drawerSelect.appendChild(defaultOption);

  drawersData.forEach((drawer) => {
    const option = document.createElement("option");
    option.value = drawer.drawerNumber;
    option.textContent = `Drawer ${drawer.drawerNumber}`;
    drawerSelect.appendChild(option);
  });
}

// Knapsack algorithm to maximize the number of medicines that can fit into a drawer
function knapsack(medicines, capacity) {
  const n = medicines.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

  // Building the dp table
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (medicines[i - 1].weight * medicines[i - 1].quantity <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w], 
          dp[i - 1][w - (medicines[i - 1].weight * medicines[i - 1].quantity)] + medicines[i - 1].quantity
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Retrieving the selected medicines from the dp table
  let selectedMedicines = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedMedicines.push(medicines[i - 1]);
      w -= medicines[i - 1].weight * medicines[i - 1].quantity;
    }
  }

  return selectedMedicines;
}

// Add medicine to the inventory
function addMedicine() {
  const name = document.getElementById("medicineName").value.trim();
  const weight = parseFloat(document.getElementById("medicineWeight").value);
  const quantity = parseInt(document.getElementById("medicineQuantity").value, 10);
  const cost = parseFloat(document.getElementById("medicineCost").value);
  const selectedDrawer = document.getElementById("drawerSelect").value;

  if (isNaN(weight) || isNaN(quantity) || isNaN(cost) || name === "" || selectedDrawer === "") {
    alert("Please fill all fields correctly and select a drawer.");
    return;
  }

  const drawer = drawersData.find((d) => d.drawerNumber === selectedDrawer);
  if (drawer) {
    // Perform knapsack optimization to find the best combination of medicines
    const availableSpace = drawer.capacity - drawer.currentWeight;
    const medicineToAdd = [{ name, weight, quantity, cost }];
    const optimizedMedicines = knapsack(medicineToAdd, availableSpace);

    // Check if the knapsack result has any medicines selected
    if (optimizedMedicines.length > 0) {
      // Update the drawer's weight
      drawer.currentWeight += optimizedMedicines[0].weight * optimizedMedicines[0].quantity;
      medicinesData.push({
        name: optimizedMedicines[0].name,
        weight: optimizedMedicines[0].weight,
        quantity: optimizedMedicines[0].quantity,
        cost: optimizedMedicines[0].cost,
        drawer: selectedDrawer
      });
      saveData();
      alert("Medicine added successfully.");
    } else {
      alert("No space available in the selected drawer.");
    }
  }
}

// Remove medicine from the inventory
// Remove a specific quantity of medicine from the inventory
function removeMedicine() {
    const name = document.getElementById("removeMedicineName").value.trim();
    const quantityToRemove = parseInt(document.getElementById("removeMedicineQuantity").value, 10); // Added quantity input
  
    if (isNaN(quantityToRemove) || quantityToRemove <= 0) {
      alert("Please enter a valid quantity to remove.");
      return;
    }
  
    const medicineIndex = medicinesData.findIndex((med) => med.name === name);
  
    if (medicineIndex !== -1) {
      const medicine = medicinesData[medicineIndex];
      
      if (medicine.quantity < quantityToRemove) {
        alert("The quantity to remove is greater than the available quantity.");
        return;
      }
  
      // Update the quantity
      medicine.quantity -= quantityToRemove;
  
      // If the quantity becomes zero, remove the medicine from the inventory entirely
      if (medicine.quantity === 0) {
        medicinesData.splice(medicineIndex, 1);
      }
  
      // Update the drawer's weight
      const drawer = drawersData.find((d) => d.drawerNumber === medicine.drawer);
      if (drawer) {
        drawer.currentWeight -= medicine.weight * quantityToRemove;
      }
  
      saveData();
      alert(`${quantityToRemove} of ${name} removed successfully.`);
    } else {
      alert("Medicine not found.");
    }
  }
  

// Search for a medicine by name
function searchMedicine() {
  const searchQuery = document.getElementById("searchMedicine").value.toLowerCase().trim();
  const searchResultDiv = document.getElementById("searchResult");

  searchResultDiv.innerHTML = ""; // Clear previous results

  if (searchQuery === "") {
    searchResultDiv.textContent = "Please enter a medicine name to search.";
    return;
  }

  const results = medicinesData.filter((med) =>
    med.name.toLowerCase().includes(searchQuery)
  );

  if (results.length > 0) {
    results.forEach((medicine) => {
      const medicineElement = document.createElement("div");
      medicineElement.textContent = `${medicine.name} - Quantity: ${medicine.quantity}, Drawer: ${medicine.drawer}`;
      searchResultDiv.appendChild(medicineElement);
    });
  } else {
    searchResultDiv.textContent = "No medicine found.";
  }
}

// Update CSV file with the latest data
function updateCSV() {
  const csvMedicines = convertToCSV(medicinesData);
  const csvDrawers = convertToCSV(drawersData);

  const combinedCSV = `Medicines:\n${csvMedicines}\n\nDrawers:\n${csvDrawers}`;

  // Save the combined CSV to a single file when the user requests it
  downloadCSV(combinedCSV, "Inventory.csv");
}

// Helper function to convert JSON data to CSV format
function convertToCSV(data) {
  const header = Object.keys(data[0]).join(","); // Create header row
  const rows = data.map(item => Object.values(item).join(","));
  return [header, ...rows].join("\n");
}

// Helper function to trigger the CSV download
function downloadCSV(csvData, filename) {
  const blob = new Blob([csvData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// Initialize the dropdown and set up event listeners
document.addEventListener("DOMContentLoaded", function () {
  loadData();
});

document.getElementById("addMedicineForm").addEventListener("submit", function (event) {
  event.preventDefault();
  addMedicine();
});

document.getElementById("removeMedicineForm").addEventListener("submit", function (event) {
  event.preventDefault();
  removeMedicine();
});

// Set up the "Download CSV" button
document.getElementById("downloadCSV").addEventListener("click", function () {
  updateCSV();
});
