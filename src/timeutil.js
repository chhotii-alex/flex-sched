// TODO there's duplicate code in DailSched.svelte, also, not dealing with mock
//   TODO: centralize time handling

export function timeStringToMinutes(str) {
  if (typeof str != "string") return 0;
  let fields = str.split(":");
  let minutes = 60 * parseInt(fields[0]);
  if (fields.length > 1) {
    minutes += parseInt(fields[1]);
  }
  return minutes;
}
