#!/bin/bash

: <<'begin_and_end'
This was 100% written by GPT on its first try, using these insructions only (which is also a handy way to describe it, so:)
I want you to write a shell script which uses 'jq' json tool. it should perform this way:
1. start w a numbered listing of all 'memories' by title.
2. prompt user to select title by number
3. prompt user to decide, selecting by first letter of choices: Delete, Edit
4. if edit, prompt user to enter new title or press enter to keep
5. do same for text element
6. save the edited 'memory' back to the object and save the object to memories.json
7. if Delete, delete memory from object andn save object back to memories.json.


If you trash the syntax, ABT will overwrite the file with a single default memory. So..making a backup would be smart.

begin_and_end



# Load JSON data from memories.json
memories=$(cat memories.json)

# Count memories and generate list of titles
num_memories=$(echo $memories | jq '. | length')
titles=$(echo $memories | jq -r '.[].title')

# Prompt user to select a memory by number
echo "Select a memory to edit or delete:"
echo "$titles" | cat -n
read -p "Enter a number: " memory_num

# Get the selected memory's index in the JSON array
memory_index=$((memory_num - 1))

# Prompt user to edit or delete the selected memory
echo "Edit or delete memory?"
select choice in "Edit" "Delete"; do
  case $choice in
    Edit)
      # Prompt user to edit the title or text
      read -p "Enter a new title or press Enter to keep the existing one: " new_title
      read -p "Enter new text or press Enter to keep the existing one: " new_text

      # Update the selected memory's title and/or text if the user entered new values
      if [ "$new_title" != "" ]; then
        memories=$(echo $memories | jq --argjson index $memory_index --arg new_title "$new_title" '.[$index].title = $new_title')
      fi

      if [ "$new_text" != "" ]; then
        memories=$(echo $memories | jq --argjson index $memory_index --arg new_text "$new_text" '.[$index].text = $new_text')
      fi

      break
      ;;
    Delete)
      # Remove the selected memory from the JSON array
      memories=$(echo $memories | jq "del(.[${memory_index}])")

      break
      ;;
  esac
done

# Save the updated JSON data to memories.json
echo $memories > memories.json
