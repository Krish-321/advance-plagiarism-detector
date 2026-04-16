const memoryStore = [];

function pushAnalysis(record) {
  memoryStore.unshift(record);
  if (memoryStore.length > 50) {
    memoryStore.length = 50;
  }
}

function getMemoryHistory() {
  return memoryStore;
}

module.exports = { pushAnalysis, getMemoryHistory };
