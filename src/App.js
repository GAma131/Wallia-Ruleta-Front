import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import * as easing from "./easing";
import {Wheel} from 'https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js';

function App() {
  const [participants, setParticipants] = useState([]);
  const [rouletteData, setRouletteData] = useState([]);
  const [winner, setWinner] = useState("");
  const wheelRef = useRef(null);

  const BACKEND_URL = "http://localhost:3000"; // Cambiar esto según el backend

  const fetchParticipants = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/roulette`);
      setParticipants(response.data); // Carga todos los participantes
      const unselectedParticipants = response.data.filter(
        (participant) => !participant.seleccionado,
      );
      setRouletteData(
        unselectedParticipants.map((participant) => ({
          label: participant.nombre,
        })),
      );
      console.log(rouletteData);
    } catch (error) {
      console.error("Error al cargar los participantes:", error);
    }
  };

  const spinWheel = () => {
    if (!wheelRef.current) return;

    const duration = 2600; // Duración del giro en ms
    const revolutions = 3; // Número de revoluciones completas
    const spinDirection = 1; // Dirección del giro (1: horario, -1: antihorario)
    const easingFunction = easing.sinInOut; // Función de easing opcional

    const winningIndex = Math.floor(Math.random() * rouletteData.length);

    wheelRef.current.spinToItem(
      winningIndex,
      duration,
      true,
      revolutions,
      spinDirection,
      easingFunction
    );

    // Actualizar el estado del ganador
    setTimeout(() => {
      const winnerLabel = rouletteData[winningIndex]?.label || "Desconocido";
      setWinner(winnerLabel);

      // Aquí podrías enviar el ganador al backend si es necesario
      // axios.post(`${BACKEND_URL}/api/roulette/winner`, { winner: winnerLabel });
    }, duration + 500);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    const container = document.querySelector(".wheel-wrapper");

    if(rouletteData.length > 0 && !wheelRef.current) {
      const props = {
        debug: true,
        items: rouletteData,
        itemLabelRadiousMax: 0.5,
      };

      wheelRef.current = new Wheel(container, props);
    }
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
        <div className="wheel-wrapper"></div>
        <button onClick={spinWheel} className="btn-spin">
          Girar
        </button>
        {winner && (
          <div className="winner-announcement">
            <h3>¡Ganador!</h3>
            <p>{winner}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
