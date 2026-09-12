"use client";
import { use, useEffect } from "react";
import { usePetory } from "../../../context";
import PetForm from "../../../components/PetForm";

export default function EditPetPage({ params }) {
  const { id } = use(params);
  const { state, editPet } = usePetory();

  useEffect(() => {
    if (state.petForm.id !== id) editPet(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return <PetForm title={`Edit ${state.petForm.name}`} submitLabel="Save Changes" photoPlaceholder="click to replace photo" />;
}
