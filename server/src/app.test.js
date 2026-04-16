const request = require("supertest");
const { app } = require("./app");

describe("POST /api/analyze", () => {
  it("returns schema with plagiarism and aiLikelihood", async () => {
    const text =
      "Academic plagiarism detection compares writing patterns and references. This sentence exists to exceed minimum length for validation.";

    const response = await request(app).post("/api/analyze").send({ text });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("plagiarism");
    expect(response.body).toHaveProperty("aiLikelihood");
    expect(response.body).toHaveProperty("overall");
  });
});
