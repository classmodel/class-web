export function* counter() {
  let n = 0;
  while (true) {
    yield (n += 1);
  }
}
