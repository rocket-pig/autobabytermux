const fs = require('fs');
const readline = require('readline');

// Load JSON data from memories.json
const memories = JSON.parse(fs.readFileSync('memories.json'));

// Display the menu and get user input
const memoryTitleMap = {};
memories.forEach((memory) => {
  memoryTitleMap[memory.id] = memory.title;
  console.log(`${memory.id}: ${memory.title}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the ID of the memory you want to select: ', (selectedId) => {
    selectedId = parseInt(selectedId)
  const selectedTitle = memoryTitleMap[selectedId];
  const memory = memories.find((m) => m.id === selectedId);

  console.log('Selected memory:');
  console.log(memory);
  console.log('What would you like to do?');
  console.log('1) Edit');
  console.log('2) Delete');

  rl.question('Enter a number: ', (action) => {
    if (action === '1') {
      // Edit the memory
      rl.question('Enter new title (leave blank to keep existing title):\n> ', (newTitle) => {
        rl.question('Enter new text (leave blank to keep existing text):\n> ', (newText) => {
          const updatedMemory = {
            ...memory,
            title: newTitle || memory.title,
            text: newText || memory.text
          };
          const updatedMemories = memories.map((m) => (m.id === selectedId ? updatedMemory : m));
          fs.writeFileSync('memories.json', JSON.stringify(updatedMemories));
          console.log('Memory updated.');
          rl.close();
        });
      });
    } else if (action === '2') {
      // Delete the memory
      const updatedMemories = memories.filter((m) => m.id !== selectedId);
      fs.writeFileSync('memories.json', JSON.stringify(updatedMemories));
      console.log('Memory deleted.');
      rl.close();
    } else {
      console.log('Invalid input.');
      rl.close();
    }
  });
});
