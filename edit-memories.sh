#!/bin/bash

: <<'begin_and_end'
This was ~~100%~~, eh 60% written by GPT on its ~~first~~ (lets make that 17th) try, using these insructions only (which is also a handy way to describe it, so:)
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

#!/bin/bash

# Load JSON data from memories.json
memories=$(cat memories.json)

# Generate list of memories with numbered IDs and titles
memories_list=$(echo $memories | jq -r '.[] | "\(.title)"')

# Create an array of memory IDs
memory_ids=($(echo $memories | jq -r '.[].id'))

# Generate a mapping between sequential menu numbers and memory IDs
declare -A memory_id_map
for (( i=0; i<${#memory_ids[@]}; i++ )); do
  memory_id_map["$((i+1))"]="${memory_ids[$i]}"
done

# Prompt user to select a memory by number
echo "Select a memory to edit or delete:"
echo "$memories_list" | nl -s ") "
read -p "Enter a number: " menu_number
memory_id="${memory_id_map[$menu_number]}"

# Get the index of the selected memory in the JSON array
memory_index=$(echo $memories | jq -r ".[] | select(.id == \"$memory_id\")")

# Check if the memory was found
if [ "$memory_index" = "null" ]; then
    echo "Memory not found."
    exit 1
fi

# Prompt user to edit or delete the memory
memory=$(echo $memories | jq -r ".[] | select(.id == "$memory_id")")
echo "Selected memory:"
echo "$memory"
echo "What would you like to do?"
echo "1) Edit"
echo "2) Delete"
read -p "Enter a number: " action

# Edit or delete the memory based on user input
if [ "$action" = "1" ]; then
    # Edit the memory
    echo "Enter new title (leave blank to keep existing title):"
    read -p "> " new_title
    echo "Enter new text (leave blank to keep existing text):"
    read -p "> " new_text
    new_memory=$(echo $memory | jq --arg new_title "$new_title" --arg new_text "$new_text" '. | if ($new_title != "") then .title = $new_title else . end | if ($new_text != "") then .text = $new_text else . end')
    memories=$(echo $memories | jq ".[$memory_index | tonumber] = $new_memory")
    echo "$memories" > memories.json
    echo "Memory updated."

elif [ "$action" = "2" ]; then
    # Delete the memory
    memories=$(echo $memories | jq "del(.[$memory_index | tonumber])")
    echo "$memories" > memories.json
    echo "Memory deleted."
fi
