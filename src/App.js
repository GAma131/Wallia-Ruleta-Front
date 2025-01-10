import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const BACKEND_URL = "http://localhost:3000"; // Cambiar esto según el backend

  // **Carga inicial de participantes desde el backend**
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/roulette`);
        const filteredParticipants = response.data.filter(
          (participant) => !participant.seleccionado // Filtra por `seleccionado: false`
        );
        console.log("Participantes:", filteredParticipants);
        setParticipants(filteredParticipants);
      } catch (error) {
        console.error("Error al cargar los participantes:", error);
      }
    };

    fetchParticipants();
  }, []);

  // **Función para girar la ruleta**
  const spinRoulette = () => {
    if (participants.length === 0) {
      alert("Todos han sido seleccionados. Reiniciando la ruleta.");
      return;
    }

    setIsSpinning(true);

    const randomIndex = Math.floor(Math.random() * participants.length);
    const chosen = participants[randomIndex];
    const anglePerSegment = 360 / (participants.length || 1);
    const randomAngle = randomIndex * anglePerSegment;
    const additionalRotations = 5 * 360;
    const finalRotation = additionalRotations + randomAngle;

    setWheelRotation((prevRotation) => prevRotation + finalRotation);

    setTimeout(async () => {
      setSelectedParticipant(chosen.nombre); // Muestra el nombre del participante
      console.log(chosen._id);

      // Actualizar el backend para marcar como seleccionado
      try {
        await axios.patch(`${BACKEND_URL}/api/roulette`, { id: chosen._id });
        const res = await axios.get(`${BACKEND_URL}/api/roulette/restart`);
        if (res.data === true) {
          console.log("Respuesta exitosa, esperando 3 segundos...");
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Espera 3 segundos
        }

        const response = await axios.get(`${BACKEND_URL}/api/roulette`);
        const filteredParticipants = response.data.filter(
          (participant) => !participant.seleccionado
        );

        console.log("Participantes actualizados:", filteredParticipants);
        setParticipants(filteredParticipants);
      } catch (error) {
        console.error("Error al actualizar el participante:", error);
      }

      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="roulette-container">
      <h1>Ruleta para el Daily</h1>
      <div className="roulette">
        <div
          className={`wheel ${isSpinning ? "spinning" : ""}`}
          style={{
            transform: `rotate(${wheelRotation}deg)`,
          }}
        >
          {participants.map((participant, index) => {
            const anglePerSegment = 360 / participants.length;
            console.log("rendering", participant.nombre, "at angle", anglePerSegment * index);
            return (
              <div
                key={participant._id} // Usa `_id` como clave única
                className="segment"
                style={{
                  transform: `rotate(${anglePerSegment * index}deg) skewY(-${
                    90 - anglePerSegment
                  }deg)`,
                  backgroundColor: `hsl(${
                    (index * 360) / participants.length
                  }, 70%, 50%)`,
                }}
              >
                <div
                  className="segment-text"
                  style={{
                    transform: `skewY(${90 - anglePerSegment}deg) rotate(${
                      anglePerSegment / 2
                    }deg)`,
                  }}
                >
                  {participant.nombre} {/* Usa `nombre` para mostrar */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={spinRoulette} disabled={isSpinning}>
        Girar Ruleta
      </button>
      {selectedParticipant && <h2>Seleccionado: {selectedParticipant}</h2>}
    </div>
  );
}

export default App;
