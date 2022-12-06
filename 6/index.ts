const MARKER_SIZE = 4;
let marker: string[] = [];
const input = await Deno.readTextFile("./input.txt");

for (let index = 0; index < input.length; index++) {
  const char = input[index];

  const charIndex = marker.indexOf(char);
  if (charIndex > -1) {
    marker = marker.slice(charIndex + 1);
  }

  marker.push(char);

  if (marker.length === MARKER_SIZE) {
    console.log(index + 1);
    break;
  }
}
