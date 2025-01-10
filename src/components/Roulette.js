import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./styles.css";

const Roulette = () => {
  const [currentRotation, setCurrentRotation] = useState(
    Math.ceil(Math.random() * 3600)
  );
  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [names, setNames] = useState([]);
  const wheelRef = useRef(null);

  const getRandomColor = (index) => {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FFC300", "#DAF7A6"];
    return colors[index % colors.length];
  };


  useEffect(() => {
    const fetchData = async () => {
        try{
            const response = await axios.get('http://localhost:3000/api/roulette');
            const formattedData = response.data
            .filter((item) => !item.seleccionado)
            .map((item, index) => ({
                value: item.nombre,
                color: getRandomColor(index),
            }));
            setNames(formattedData);
            console.log('Formatted data: ', formattedData);
        } catch(error){
            console.error('Error fetching data: ', error);
        }
    };
    fetchData();
  }, []);

  const spinWheel = () => {
    const segmentAngle = 360 / names.length; // Ángulo por segmento
    const randomIndex = Math.floor(Math.random() * names.length); // Índice aleatorio
    const totalRotation = 360 * 5 + randomIndex * segmentAngle; // Rotación total simulada

    // Animar la rueda
    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 4s ease-in-out";
      wheelRef.current.style.transform = `rotate(${
        totalRotation + currentRotation
      }deg)`;
    }

    setTimeout(() => {
      // Calcular el ángulo final efectivo
      const finalAngle =
        (totalRotation + currentRotation) % 360; // Ángulo después de completar las vueltas
      const resultIndex = Math.floor(
        (names.length - Math.floor(finalAngle / segmentAngle)) % names.length
      ); // Mapear el ángulo al índice correspondiente

      setModalMessage(
        `¡Felicidades! tu descuento es de ${names[resultIndex].value}%`
      );
      setIsModalOpen(true);
      launchConfetti();
    }, 4000);

    setCurrentRotation((totalRotation + currentRotation));
  };


  const launchConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  return (
    <div className="container">
      <div className="spinBtn" onClick={spinWheel}>
        SPIN
      </div>
      <div className="wheel" ref={wheelRef}>
        {names.map((name, index) => (
          <div
            key={index}
            className="name"
            style={{
                "--i": index,
                "--total": names.length,
                "--clr": name.color,
              }}
          >
            <span>{name.value}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div
          className="modal"
          style={{ display: isModalOpen ? "flex" : "none" }}
          onClick={() => setIsModalOpen(false)}
        >
          <div className="modal-content">
            <p>{modalMessage}</p>
            <button
              id="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roulette;