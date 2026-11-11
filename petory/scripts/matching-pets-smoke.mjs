import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

/** Called only by integration-smoke against its explicitly disposable test DB. */
export async function runMatchingPetsSmoke(request, aom, niran) {
  const create = async (cookie, body) => {
    const response = await request("/api/pets", { method: "POST", cookie, body });
    assert.equal(response.status, 201);
    return (await response.json()).pet;
  };
  const basePet = { name: "Gallery smoke", species: "Dog", breed: "Mixed", age: 3, weightKg: 8, gender: "Unknown", size: "Medium", bio: "", personality: [], interests: [] };
  const original = await request("/api/pets", { cookie: aom.cookie });
  const existing = (await original.json()).pets.find((pet) => pet.photoMediaId);
  assert(existing?.photoMediaIds.includes(existing.photoMediaId), "existing photo must remain available as gallery photo");

  const bytes = await readFile("public/uploads/demo/recipe-dog-biscuits.jpg");
  const photos = [];
  for (let index = 0; index < 5; index += 1) {
    const body = new FormData();
    body.set("file", new Blob([bytes], { type: "image/jpeg" }), `gallery-${index}.jpg`);
    const response = await request("/api/media", { method: "POST", cookie: aom.cookie, body });
    assert.equal(response.status, 201);
    photos.push((await response.json()).mediaId);
  }
  const galleryPet = await create(aom.cookie, { ...basePet, photoMediaIds: photos });
  assert.deepEqual(galleryPet.photoMediaIds, photos);
  assert.equal(galleryPet.photoMediaId, photos[0]);
  assert.equal((await request(`/api/media/${photos[4]}`, { cookie: niran.cookie })).status, 200);
  assert.equal((await request("/api/pets", { method: "POST", cookie: niran.cookie, body: { ...basePet, photoMediaIds: photos } })).status, 422);
  assert.equal((await request("/api/pets", { method: "POST", cookie: aom.cookie, body: { ...basePet, photoMediaIds: [...photos, "00000000-0000-4000-8000-000000000001"] } })).status, 422);
  let response = await request(`/api/pets/${galleryPet.id}`, { method: "PUT", cookie: aom.cookie, body: { ...basePet, photoMediaIds: [photos[4], photos[0]] } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).pet.photoMediaIds, [photos[4], photos[0]]);
  response = await request(`/api/pets/${galleryPet.id}`, { method: "PUT", cookie: aom.cookie, body: { ...basePet, photoMediaId: null } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).pet.photoMediaIds, [], "legacy client can remove gallery");

  const target = await create(niran.cookie, { ...basePet, name: "Distance target" });
  for (const [account, position] of [[aom, { latitude: 13.75, longitude: 100.50 }], [niran, { latitude: 13.76, longitude: 100.51 }]]) {
    assert.equal((await request("/api/matching/location", { method: "PUT", cookie: account.cookie, body: position })).status, 200);
  }
  const candidates = async (filters) => {
    const result = await request(`/api/matching/candidates?actorPetId=${galleryPet.id}&${filters}`, { cookie: aom.cookie });
    assert.equal(result.status, 200);
    return (await result.json()).candidates;
  };
  assert((await candidates("minAge=3&maxAge=3&distance=5")).some((pet) => pet.id === target.id));
  assert(!(await candidates("minAge=0&maxAge=2&distance=5")).some((pet) => pet.id === target.id));
  assert(!(await candidates("minAge=3&maxAge=3&distance=1")).some((pet) => pet.id === target.id));
  assert.equal((await request("/api/matching/location", { method: "PUT", cookie: niran.cookie, body: null })).status, 200);
  assert(!(await candidates("distance=5")).some((pet) => pet.id === target.id));
  assert.equal((await request(`/api/pets/${target.id}`, { method: "DELETE", cookie: niran.cookie })).status, 204);
  assert.equal((await request(`/api/pets/${galleryPet.id}`, { method: "DELETE", cookie: aom.cookie })).status, 204);
}
