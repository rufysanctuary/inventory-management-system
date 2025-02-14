// Global arrays and editing indices
let unallocatedAssets = [];
let allocatedAssets = [];
let editingUnallocatedIndex = null; // For editing unallocated asset records

// When the page loads, load saved data and update the UI
document.addEventListener("DOMContentLoaded", function () {
  // Load data from localStorage
  unallocatedAssets = JSON.parse(localStorage.getItem("unallocatedAssets")) || [];
  allocatedAssets = JSON.parse(localStorage.getItem("allocatedAssets")) || [];

  updateUnallocatedTable();
  updateAllocatedTable();
  updateAllocationDropdown();

  // Asset Entry Form submission (for unallocated assets)
  document.getElementById("assetEntryForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const assetName = document.getElementById("assetName").value.trim();
    const serialNumber = document.getElementById("serialNumber").value.trim();
    const assetImageInput = document.getElementById("assetImage");

    if (assetName === "" || serialNumber === "") {
      alert("Please fill in all required fields.");
      return;
    }

    // Check if we are editing an existing unallocated asset
    if (editingUnallocatedIndex === null) {
      // New asset entry
      if (assetImageInput.files && assetImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          unallocatedAssets.push({ assetName, serialNumber, image: e.target.result });
          saveData();
          updateUnallocatedTable();
          updateAllocationDropdown();
        };
        reader.readAsDataURL(assetImageInput.files[0]);
      } else {
        unallocatedAssets.push({ assetName, serialNumber, image: "" });
        saveData();
        updateUnallocatedTable();
        updateAllocationDropdown();
      }
    } else {
      // Editing existing asset in unallocated list
      if (assetImageInput.files && assetImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          unallocatedAssets[editingUnallocatedIndex] = { assetName, serialNumber, image: e.target.result };
          editingUnallocatedIndex = null;
          saveData();
          updateUnallocatedTable();
          updateAllocationDropdown();
        };
        reader.readAsDataURL(assetImageInput.files[0]);
      } else {
        // Keep previous image if no new file provided
        unallocatedAssets[editingUnallocatedIndex] = {
          assetName,
          serialNumber,
          image: unallocatedAssets[editingUnallocatedIndex].image,
        };
        editingUnallocatedIndex = null;
        saveData();
        updateUnallocatedTable();
        updateAllocationDropdown();
      }
    }
    document.getElementById("assetEntryForm").reset();
  });

  // Asset Allocation Form submission (move an asset from unallocated to allocated)
  document.getElementById("assetAllocationForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const staffName = document.getElementById("staffName").value.trim();
    const allocationDate = document.getElementById("allocationDate").value;
    const expiryDate = document.getElementById("expiryDate").value || "N/A";
    const allocationImageInput = document.getElementById("allocationImage");
    const selectedIndex = document.getElementById("allocatedAsset").value;

    if (staffName === "" || allocationDate === "" || selectedIndex === "") {
      alert("Please fill in all required fields.");
      return;
    }

    // Get the asset from unallocated list
    let asset = unallocatedAssets[selectedIndex];

    // If an updated image is provided, use it
    if (allocationImageInput.files && allocationImageInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        asset.image = e.target.result;
        allocateAsset(asset);
      };
      reader.readAsDataURL(allocationImageInput.files[0]);
    } else {
      allocateAsset(asset);
    }

    function allocateAsset(asset) {
      // Add asset to allocated list with allocation info
      allocatedAssets.push({
        staffName: staffName,
        assetName: asset.assetName,
        serialNumber: asset.serialNumber,
        image: asset.image,
        allocationDate: allocationDate,
        expiryDate: expiryDate,
      });
      // Remove asset from unallocated list
      unallocatedAssets.splice(selectedIndex, 1);
      saveData();
      updateUnallocatedTable();
      updateAllocatedTable();
      updateAllocationDropdown();
      document.getElementById("assetAllocationForm").reset();
    }
  });
});

// Save data to localStorage
function saveData() {
  localStorage.setItem("unallocatedAssets", JSON.stringify(unallocatedAssets));
  localStorage.setItem("allocatedAssets", JSON.stringify(allocatedAssets));
}

// Update the Unallocated Assets table and allocation dropdown
function updateUnallocatedTable() {
  const tbody = document.getElementById("unallocatedTable").getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  unallocatedAssets.forEach((asset, index) => {
    let row = tbody.insertRow();
    row.innerHTML = `
      <td>${asset.assetName}</td>
      <td>${asset.serialNumber}</td>
      <td>${asset.image ? `<img src="${asset.image}" alt="Asset Image">` : ""}</td>
      <td>
        <button onclick="editUnallocated(${index})">Edit</button>
        <button onclick="deleteUnallocated(${index})">Delete</button>
      </td>
    `;
  });
}

function updateAllocationDropdown() {
  const select = document.getElementById("allocatedAsset");
  select.innerHTML = "";
  unallocatedAssets.forEach((asset, index) => {
    let option = document.createElement("option");
    option.value = index;
    option.textContent = `${asset.assetName} (${asset.serialNumber})`;
    select.appendChild(option);
  });
}

// Update the Allocated Assets table
function updateAllocatedTable() {
  const tbody = document.getElementById("allocatedTable").getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  allocatedAssets.forEach((asset, index) => {
    let row = tbody.insertRow();
    row.innerHTML = `
      <td>${asset.staffName}</td>
      <td>${asset.assetName}</td>
      <td>${asset.serialNumber}</td>
      <td>${asset.image ? `<img src="${asset.image}" alt="Asset Image">` : ""}</td>
      <td>${asset.allocationDate}</td>
      <td>${asset.expiryDate}</td>
      <td>
        <button onclick="editAllocated(${index})">Edit</button>
        <button onclick="deleteAllocated(${index})">Delete</button>
      </td>
    `;
  });
}

// Delete functions
function deleteUnallocated(index) {
  if (confirm("Are you sure you want to delete this asset?")) {
    unallocatedAssets.splice(index, 1);
    saveData();
    updateUnallocatedTable();
    updateAllocationDropdown();
  }
}

function deleteAllocated(index) {
  if (confirm("Are you sure you want to delete this allocated asset?")) {
    allocatedAssets.splice(index, 1);
    saveData();
    updateAllocatedTable();
  }
}

// Edit functions for unallocated assets
function editUnallocated(index) {
  const asset = unallocatedAssets[index];
  document.getElementById("assetName").value = asset.assetName;
  document.getElementById("serialNumber").value = asset.serialNumber;
  // The image field remains optional – re-upload if you wish to change it.
  editingUnallocatedIndex = index;
}

// Edit function for allocated assets – moves the asset back to unallocated for editing
function editAllocated(index) {
  const asset = allocatedAssets[index];
  // Pre-fill the asset entry form with the asset details
  document.getElementById("assetName").value = asset.assetName;
  document.getElementById("serialNumber").value = asset.serialNumber;
  // Inform the user that the asset will be moved back for editing
  alert("This allocated asset will be moved back to Unallocated Assets for editing. Please update the details and add it again.");
  // Move asset back to unallocated list
  allocatedAssets.splice(index, 1);
  unallocatedAssets.push({ assetName: asset.assetName, serialNumber: asset.serialNumber, image: asset.image });
  saveData();
  updateAllocatedTable();
  updateUnallocatedTable();
  updateAllocationDropdown();
}

// Simple search function for tables
function searchTable(tableId, query) {
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName("tr");
  query = query.toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let match = false;
    for (let cell of cells) {
      if (cell.textContent.toLowerCase().includes(query)) {
        match = true;
        break;
      }
    }
    rows[i].style.display = match ? "" : "none";
  }
}

// Download table data as Excel
function downloadExcel(tableId, fileName) {
  const tableHTML = document.getElementById(tableId).outerHTML.replace(/ /g, "%20");
  const dataType = "application/vnd.ms-excel";
  const downloadLink = document.createElement("a");
  downloadLink.href = "data:" + dataType + ", " + tableHTML;
  downloadLink.download = fileName + ".xls";
  downloadLink.click();
}
