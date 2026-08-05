const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeRoom,
  isTimeOverlap,
  isDateRangeOverlap,
} = require("../utils/classScheduleConflict.utils");

test("Chuẩn hóa tên phòng", () => {
  assert.equal(normalizeRoom(" Phòng 103 "), "phòng 103");

  assert.equal(normalizeRoom("PHÒNG 103"), "phòng 103");

  assert.equal(normalizeRoom(""), "");
  assert.equal(normalizeRoom(undefined), "");
});

test("Hai khoảng giờ giao nhau", () => {
  assert.equal(isTimeOverlap("08:00", "10:00", "09:00", "11:00"), true);
});

test("Hai khoảng giờ nằm hoàn toàn trong nhau", () => {
  assert.equal(isTimeOverlap("08:00", "12:00", "09:00", "10:00"), true);
});

test("Hai ca nối tiếp nhau không bị coi là trùng", () => {
  assert.equal(isTimeOverlap("08:00", "10:00", "10:00", "12:00"), false);
});

test("Hai ca hoàn toàn tách biệt không trùng", () => {
  assert.equal(isTimeOverlap("08:00", "09:00", "10:00", "11:00"), false);
});

test("Hai khoảng ngày giao nhau", () => {
  assert.equal(
    isDateRangeOverlap("2026-08-01", "2026-09-30", "2026-09-01", "2026-10-31"),
    true,
  );
});

test("Hai khoảng ngày tách biệt", () => {
  assert.equal(
    isDateRangeOverlap("2026-08-01", "2026-09-30", "2026-10-01", "2026-12-31"),
    false,
  );
});

test("Không có ngày kết thúc được coi là không giới hạn", () => {
  assert.equal(
    isDateRangeOverlap("2026-08-01", undefined, "2030-01-01", "2030-12-31"),
    true,
  );
});

test("Không nhập khoảng ngày vẫn có thể giao nhau", () => {
  assert.equal(
    isDateRangeOverlap(undefined, undefined, "2026-08-01", "2026-12-31"),
    true,
  );
});
