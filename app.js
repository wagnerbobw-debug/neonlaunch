const feeSpan = document.getElementById("fee");

let createdToday = 0;
const fees = [0.02, 0.05, 0.10, 0.20];

document.getElementById("createBtn").onclick = () => {
  const fee = fees[Math.min(createdToday, 3)];
  alert(
    `Token erstellt (Demo)\n` +
    `Create Fee: ${fee} BNB\n` +
    `Anti-Bot aktiv`
  );
  createdToday++;
  feeSpan.textContent = fees[Math.min(createdToday, 3)].toFixed(2) + " BNB";
};
