import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as easing from "./easing";
import { Wheel } from "./spin-wheel/spin-wheel-esm.js";
import Swal from "sweetalert2";
import ruletaSound from "./assets/Ruleta.mp3";
import aplausosSound from "./assets/Aplausos.mp3";

function App() {
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [rouletteData, setRouletteData] = useState([]);
  const [winner, setWinner] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarData, setCalendarData] = useState({});
  const [cancelledParticipants, setCancelledParticipants] = useState([]);
  const [filter, setFilter] = useState(() => {
    return localStorage.getItem("filter") || "web";
  });
  const wheelRef = useRef(null);
  const ruletaAudioRef = useRef(new Audio(ruletaSound));
  const aplausosAudioRef = useRef(new Audio(aplausosSound));

  const BACKEND_URL = "/prod";
  const AUTH_TOKEN = "eHhXYWxsaWFSdWxldGEyMDI1eHg=";

  const formatDate = (date) => date.toISOString().split("T")[0];

  const fetchParticipants = async () => {
    try {
      await axios.post(`${BACKEND_URL}/participantes/restartRoulette`, {
        depa: filter,
      }, {
        headers: { 'Authorization': AUTH_TOKEN }
      });

      const response = await axios.get(`${BACKEND_URL}/participantes/getParticipantes`, {
        headers: { 'Authorization': AUTH_TOKEN }
      });
      setParticipants(response.data);

      applyFilter(response.data, filter);

      const calendarResponse = await axios.get(
        `${BACKEND_URL}/participantes/getHistorico`,
        {
          headers: { 'Authorization': AUTH_TOKEN }
        }
      );

      const calendarFilter = calendarResponse.data.filter((participant) =>
        participant.departamento.includes(filter)
      );

      const formattedCalendarData = calendarFilter.reduce((acc, entry) => {
        const [day, month, year] = entry.fecha.split(",")[0].split("/");
        const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;

        if (!acc[formattedDate]) acc[formattedDate] = [];
        acc[formattedDate].push(entry.nombre);
        return acc;
      }, {});

      setCalendarData(formattedCalendarData);
    } catch (error) {
      console.error("Error fetching participants or calendar data:", error);
    }
  };

  const applyFilter = (allParticipants, filter) => {
    const filtered = allParticipants.filter(
      (p) =>
        (filter === "all" || p.departamentos.includes(filter)) &&
        !p.seleccionado[filter]
    );

    setFilteredParticipants(filtered);

    const unselectedParticipants = filtered.filter(
      (p) =>
        !p.seleccionado[filter] &&
        !cancelledParticipants.includes(p.nombre)
    );
    setRouletteData(unselectedParticipants.map((p) => ({ label: p.nombre })));
  };

  const playSound = (audioRef) => {
    audioRef.currentTime = 0;
    audioRef.play();
  };

  const stopSound = (audioRef) => {
    audioRef.pause();
    audioRef.currentTime = 0;
  };

  const createWheel = (container, items) => {
    container.innerHTML = '';
    const baseColors = ["#2DB7E6", "#304D93", "#22A5C4", "#1F3360"];
    let colors = [...baseColors]; // Copiar la paleta original

    // Si el número de elementos es impar, elimina un color de la paleta
    if (items.length % 2 !== 0) {
      colors.pop(); // Elimina el último color
    }

    const props = {
      items,
      name: "Takeaway",
      radius: 0.89,
      itemLabelRadiusMax: 0.37,
      itemLabelColors: [],
      itemBackgroundColors: [],
      lineWidth: 1,
      borderWidth: 0,
    };

    // Asignar colores de fondo cíclicamente
    props.items.forEach((item, index) => {
      const color = colors[index % colors.length];
      props.itemBackgroundColors.push(color);
      props.itemLabelColors.push(color === "#304D93" ? "#fff" : "#000"); // Ajustar color del texto
    });

    wheelRef.current = new Wheel(container, props);
  };


  const spinWheel = () => {
    if (!wheelRef.current || rouletteData.length === 0) {
      Swal.fire({
        title: "¡Atención!",
        text: "No hay participantes disponibles para girar la ruleta.",
        icon: "warning",
        confirmButtonText: "Entendido",
        customClass: {
          popup: "custom-popup",
          title: "custom-title",
          confirmButton: "custom-button",
        },
      });
      return;
    }

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
      const winnerParticipant = filteredParticipants.find(
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
            axios
              .post(`${BACKEND_URL}/participantes/selectParticipante`, {
                id: winnerParticipant._id,
                departamento: filter,
              }, {
                headers: { 'Authorization': AUTH_TOKEN }
              })
              .then(() => {
                window.location.reload();
              })
              .catch((error) => {
                console.error("Error al actualizar el participante:", error);
              });
          } else {
            setCancelledParticipants(prev => [...prev, winnerLabel]);

            const updatedRouletteData = rouletteData.filter(
              item => item.label !== winnerLabel
            );
            setRouletteData(updatedRouletteData);

            setWinner(null);

            const container = document.querySelector(".wheel-wrapper");
            if (container) {
              createWheel(container, updatedRouletteData);
            }
          }
        });
      }
    }, duration);
  };

  const restoreParticipant = (participantName) => {
    setCancelledParticipants(prev =>
      prev.filter(name => name !== participantName)
    );

    const updatedRouletteData = [
      ...rouletteData,
      { label: participantName }
    ];
    setRouletteData(updatedRouletteData);

    const container = document.querySelector(".wheel-wrapper");
    if (container) {
      createWheel(container, updatedRouletteData);
    }
  };

  const toggleCalendar = () => setCalendarOpen(!calendarOpen);

  const handleDateClick = (date) => {
    const day = formatDate(date);
    const names = calendarData[day];

    if (names && Array.isArray(names) && names.length > 0) {
      Swal.fire({
        title: `Participantes del ${day}`,
        html: names
          .map((name) => `<span class="swal-participant">${name}</span>`)
          .join("<br>"),
        icon: "info",
        confirmButtonText: "Cerrar",
        customClass: {
          popup: "custom-popup",
          title: "custom-title",
          confirmButton: "custom-button",
        },
      });
    } else {
      Swal.fire({
        title: `Sin participantes`,
        text: `No hay participantes asignados para esta fecha.`,
        icon: "warning",
        confirmButtonText: "Cerrar",
        customClass: {
          popup: "custom-popup",
          title: "custom-title",
          confirmButton: "custom-button",
        },
      });
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    localStorage.setItem("filter", newFilter);
    applyFilter(participants, newFilter);
    window.location.reload();
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const calendarModal = document.querySelector(".calendar-modal");
      if (
        calendarOpen &&
        calendarModal &&
        !calendarModal.contains(event.target)
      ) {
        setCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarOpen]);

  useEffect(() => {
    const container = document.querySelector(".wheel-wrapper");
    if (rouletteData.length > 0 && container) {
      createWheel(container, rouletteData);
    }
  }, [rouletteData]);

  return (
    <div className="app-container">
      <div className="participants-list">
        <div className="participants-header">
          <h2>Participantes</h2>
          <select
            className="participants-select"
            id="filter-select"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="web">WEB</option>
            <option value="app">APP</option>
            <option value="all">ALL</option>
          </select>
        </div>
        <ul>
          {participants
            .filter(
              (participant) =>
                filter === "all" || participant.departamentos.includes(filter)
            )
            .map((participant) => (
              <li
                key={participant._id}
                className={`
                  ${participant.seleccionado[filter] ? "selected" : ""}
                  ${cancelledParticipants.includes(participant.nombre) ? "cancelled" : ""}
                `}
              >
                {participant.nombre}
                {cancelledParticipants.includes(participant.nombre) && !participant.seleccionado[filter] && (
                  <button
                    className="restore-btn"
                    onClick={() => restoreParticipant(participant.nombre)}
                  >
                    ↺
                  </button>
                )}
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
            <Calendar onClickDay={handleDateClick} />
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