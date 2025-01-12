import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2"; // Importa SweetAlert2
import "./App.css";
import logo from "./assets/logo.png";

function App() {
  const [participants, setParticipants] = useState([]);
  const [rouletteData, setRouletteData] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const BACKEND_URL = "http://localhost:3000"; // Cambiar esto según el backend

  const fetchParticipants = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/roulette`);
      setParticipants(response.data); // Carga todos los participantes
      const unselectedParticipants = response.data.filter(
        (participant) => !participant.seleccionado,
      );
      setRouletteData(unselectedParticipants);
      console.log(rouletteData);
    } catch (error) {
      console.error("Error al cargar los participantes:", error);
    }
  };

  // Generar un color hexadecimal aleatorio
  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // **Función para girar la ruleta**
  const spinRoulette = async () => {
    const availableParticipants = participants.filter(
      (participant) => !participant.seleccionado,
    ); // Filtra solo los no seleccionados

    if (availableParticipants.length === 0) {
      // Reinicia la ruleta si todos han sido seleccionados
      Swal.fire({
        title: "¡Todos han sido seleccionados!",
        text: "Reiniciando la ruleta...",
        icon: "info",
        showConfirmButton: false,
        timer: 3000, // Modal se cierra automáticamente después de 3 segundos
      });

      try {
        // Llama al backend para reiniciar la lista de participantes
        await axios.get(`${BACKEND_URL}/api/roulette/restart`);
        const response = await axios.get(`${BACKEND_URL}/api/roulette`);
        console.log("Participantes tras reinicio:", response.data); // Verifica el reinicio
        setParticipants(response.data); // Actualiza la lista con los datos reiniciados
      } catch (error) {
        console.error("Error al reiniciar la ruleta:", error);
      }
      return; // Detén la ejecución después del reinicio
    }

    setIsSpinning(true);

    // Selecciona un índice aleatorio para simular el giro
    const randomIndex = Math.floor(
      Math.random() * availableParticipants.length,
    );
    const chosen = availableParticipants[randomIndex];
    const anglePerSegment = 360 / (availableParticipants.length || 1);
    const randomAngle = randomIndex * anglePerSegment;
    const additionalRotations = 5 * 360;
    const finalRotation = additionalRotations + randomAngle;

    setWheelRotation((prevRotation) => prevRotation + finalRotation);

    // Simula el giro y espera 3 segundos
    setTimeout(async () => {
      // Muestra el participante seleccionado con SweetAlert
      Swal.fire({
        title: "¡Participante Seleccionado!",
        text: `El participante seleccionado es: ${chosen.nombre}`,
        icon: "success",
        confirmButtonText: "OK",
      });

      console.log("Seleccionado:", chosen._id);

      try {
        // Marca al participante como seleccionado en el backend
        await axios.patch(`${BACKEND_URL}/api/roulette`, { id: chosen._id });

        // Actualiza la lista de participantes localmente
        setParticipants((prev) =>
          prev.map((participant) =>
            participant._id === chosen._id
              ? { ...participant, seleccionado: true }
              : participant,
          ),
        );
      } catch (error) {
        console.error("Error al actualizar el participante:", error);
      }

      fetchParticipants();
      setIsSpinning(false);
    }, 3000);
  };

  const adjustSections = () => {
    const sections = document.querySelectorAll("#roulette .roulette-section");
    const numSections = sections.length;
    const angleStep = 360 / numSections;

    sections.forEach((section, index) => {
      const angle = angleStep * index;

      const colors = ["#A2D2DF", "#F05A7E", "#F6EFBD", "#E4C087", "#BC7C7C"];
      section.style.backgroundColor = colors[index % colors.length];

      if (numSections === 2) {
        section.style.transform = `rotate(${angle}deg) skewY(0deg)`;
        section.style.transformOrigin = index === 0 ? "100% 50%" : "0% 50%";
        section.style.height = "400px";
      } else if (numSections === 1) {
        section.style.transform = `rotate(0deg) skewY(0deg)`;
        section.style.width = "400px";
        section.style.height = "400px";
      } else if (numSections > 3) {
        const skewAngle = 90 - angleStep;
        section.style.transform = `rotate(${angle}deg) skewY(-${skewAngle}deg)`;
      }
    });
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    adjustSections();
  }, [rouletteData]);

  return (
    <div className="app-container">
      <div className="participants-list">
        <h2>Participantes</h2>
        <ul>
          {participants.map((participant) => (
            <li
              key={participant._id}
              className={participant.seleccionado ? "selected" : ""}
            >
              {participant.nombre}
            </li>
          ))}
        </ul>
      </div>
      <div className="roulette-container">
        <div id="selector"></div>
        <div id="roulette">
          {rouletteData.map((item, index) => (
            <div key={index} className="roulette-section">
              <div className="roulette-section-container">
                <p>{item.nombre}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="button-container">
          <button onClick={spinRoulette} disabled={isSpinning}>
            Girar Ruleta
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
