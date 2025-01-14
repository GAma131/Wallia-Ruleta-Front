import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import Calendar from "react-calendar"; // Importar la librería del calendario
import "react-calendar/dist/Calendar.css"; // Estilo por defecto de react-calendar
import * as easing from "./easing";
import { Wheel } from "https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js";
import Swal from "sweetalert2";
import ruletaSound from "./assets/Ruleta.mp3";
import aplausosSound from "./assets/Aplausos.mp3";

function App() {
  const [participants, setParticipants] = useState([]);
  const [rouletteData, setRouletteData] = useState([]);
  const [winner, setWinner] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false); // Control del calendario
  const [calendarData, setCalendarData] = useState({});
  const wheelRef = useRef(null);
  const ruletaAudioRef = useRef(new Audio(ruletaSound));
  const aplausosAudioRef = useRef(new Audio(aplausosSound));

  const BACKEND_URL = "http://localhost:5000";

  // Formatear fechas en formato ISO para comparar con las del calendario
  const formatDate = (date) => date.toISOString().split("T")[0];

  const fetchParticipants = async () => {
    try {
      await axios.get(`${BACKEND_URL}/api/roulette/restart`);
      const response = await axios.get(`${BACKEND_URL}/api/roulette`);
      setParticipants(response.data);

      const unselectedParticipants = response.data.filter(
        (participant) => !participant.seleccionado
      );
      setRouletteData(
        unselectedParticipants.map((participant) => ({
          label: participant.nombre,
        }))
      );

      // Crear datos para el calendario
      const calendarData = response.data.reduce((acc, participant) => {
        const date = participant.fecha.split("T")[0]; // Asegurar formato "YYYY-MM-DD"
        if (!acc[date]) acc[date] = [];
        acc[date].push(participant.nombre);
        return acc;
      }, {});
      setCalendarData(calendarData);
    } catch (error) {
      console.error("Error al cargar los participantes:", error);
    }
  };

  const playSound = (audioRef) => {
    audioRef.currentTime = 0;
    audioRef.play();
  };

  const stopSound = (audioRef) => {
    audioRef.pause();
    audioRef.currentTime = 0;
  };

  const spinWheel = () => {
    if (!wheelRef.current) return;

    const ruletaAudio = ruletaAudioRef.current;
    playSound(ruletaAudio);

    const duration = 3000;
    const revolutions = 4;
    const spinDirection = 1;
    const easingFunction = easing.sinInOut;

    const winningIndex = Math.floor(Math.random() * rouletteData.length);

    wheelRef.current.spinToItem(
      winningIndex,
      duration,
      true,
      revolutions,
      spinDirection,
      easingFunction
    );

    setTimeout(() => {
      stopSound(ruletaAudio);

      const winnerLabel = rouletteData[winningIndex]?.label || "Desconocido";
      const winnerParticipant = participants.find(
        (participant) => participant.nombre === winnerLabel
      );

      setWinner({ label: winnerLabel, participant: winnerParticipant });

      if (winnerParticipant) {
        playSound(aplausosAudioRef.current);

        Swal.fire({
          title: "¡Tenemos un ganador!",
          html: `<span style="color:rgb(255, 255, 255); font-size: 1.5rem;">El ganador es: ${winnerLabel}</span>`,
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "¡Entendido!",
          cancelButtonText: "Cancelar",
          customClass: {
            popup: "custom-popup",
            title: "custom-title",
            confirmButton: "custom-button",
            cancelButton: "custom-button",
          },
        }).then((result) => {
          stopSound(aplausosAudioRef.current);
          if (result.isConfirmed) {
            const today = new Date().toISOString(); // Fecha actual en formato ISO
            axios
              .patch(`${BACKEND_URL}/api/roulette`, {
                id: winnerParticipant._id,
                fecha: today, // Actualizar la fecha del ganador
              })
              .then(() => {
                window.location.reload();
              })
              .catch((error) => {
                console.error("Error al actualizar el participante:", error);
              });
          } else {
            setWinner(null); // Reiniciar el ganador si se cancela
          }
        });
      }
    }, duration);
  };

  const toggleCalendar = () => setCalendarOpen(!calendarOpen);

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    const container = document.querySelector(".wheel-wrapper");

    if (rouletteData.length > 0 && !wheelRef.current) {
      const props = {
        items: rouletteData,
        name: "Takeaway",
        radius: 0.89,
        itemLabelRadiusMax: 0.37,
        itemLabelColors: ["#000"],
        itemBackgroundColors: ["#749cc9", "#4DA1A9", "#79D7BE", "#aed2e0"],
        lineWidth: 0,
        borderWidth: 0,
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
        <div className="roulette-pointer"></div>
        <div className="wheel-wrapper"></div>
        <button onClick={spinWheel} className="btn-spin">
          Girar
        </button>
        <button onClick={toggleCalendar} className="btn-calendar">
          🗓️
        </button>
        {calendarOpen && (
          <div className="calendar-modal">
            <Calendar
              tileContent={({ date }) => {
                const day = formatDate(date);
                return (
                  <div className="calendar-participants">
                    {calendarData[day]?.map((name, idx) => (
                      <div key={idx}>{name}</div>
                    ))}
                  </div>
                );
              }}
            />
          </div>
        )}
        {winner && (
          <div className="winner-announcement">
            <h3>¡Ganador!</h3>
            <p>{winner.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
