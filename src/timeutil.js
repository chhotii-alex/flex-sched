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

function getNowStr() {
  let now = new Date();
  let s = now.toTimeString();
  let fields = s.split(" ");
  return fields[0];
}

function getNow() {
  let fields = getNowStr().split(":");
  for (let j = 0; j < 3; ++j) {
    if (fields[j].length != 2) {
      throw "bad time string";
    }
  }
  return [parseInt(fields[0]), parseInt(fields[1]), parseInt(fields[2])];
}

export function isAfterTime(aTime) {
  if (!aTime) return false;
  let [h, m, s] = getNow();
  let nowTime = h * 60 + m;
  let noTime = timeStringToMinutes(aTime);
  return nowTime > noTime;
}
