let db;
let budgetVersion;

const indexDB = window.indexedDB;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (e) {
  console.log("Upgrade needed");
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);
  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("pending", { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  let transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["pending"], "readwrite");
            const currentStore = transaction.objectStore("pending");
            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log("succes")
  db = e.target.result;

  if (navigator.onLine) {
    console.log("Back-end online!")
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log("Save record invoked");
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
};

window.addEventListener("online", checkDatabase);
