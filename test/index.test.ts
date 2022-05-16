import { createFetch } from "../src/";

describe("createFetch", () => {
  it("must exist", () => {
    expect(createFetch).not.toBeFalsy();
  });
});
