import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles.css";
import "../components/roulette.css";
import "../components/roulette-rotations.css";
import "../components/roulette-colors.css";

const getRandomNumber = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
};


const Roulette = () => {
    const [sections, setSections] = useState([]);
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [animationTime, setAnimationTime] = useState(0);

    // Paleta de colores
    const colors = [
      "#df0978", "#8d078d", "#3a63ba", "#4fa1de", "#23bb23", "#46b545",
      "#88c740", "#f2f215", "#f1b041", "#e35825", "#e01423", "#ffae00",
      "#82714c",
    ];

    useEffect(() => {
        const fetchSections = async () => {
            try {
              const response = await axios.get("http://localhost:3000/api/roulette");
              // Filtrar solo los elementos donde seleccionado sea false
              const nombres = response.data
                .filter((item) => !item.seleccionado) // Filtra por seleccionado=false
                .map((item) => item.nombre); // Mapea solo los nombres
              setSections(nombres);
              console.log("Sections fetched (filtered):", nombres);
            } catch (error) {
              console.error("Error fetching sections:", error);
            }
          };


      fetchSections();
    }, []);

    const spinRoulette = () => {
      if (spinning) return;

      const spins = getRandomNumber(1, 10);
      const degrees = getRandomNumber(1, 360);

      const fullRotation = (spins - 1) * 360;
      const spin = rotation + fullRotation + degrees;
      const newAnimationTime = spins;

      setRotation(spin);
      setAnimationTime(newAnimationTime);
      setSpinning(true);

      setTimeout(() => {
        setSpinning(false);
      }, newAnimationTime * 1000);
    };

    const resetRoulette = () => {
      setRotation(0);
      setSpinning(false);
      setAnimationTime(2);
    };

    return (
      <section className="roulette-container">
        <div id="selector"></div>
        <div
          id="roulette"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${animationTime}s ease-out`,
          }}
        >
          {sections.map((text, index) => {
            const totalSections = sections.length;
            const anglePerSection = 360 / totalSections;
            const rotateAngle = index * anglePerSection;
            const skewAngle = -(90 - anglePerSection);

            // Determinar el color correspondiente (en bucle si hay más secciones que colores)
            const backgroundColor = colors[index % colors.length];

            return (
              <div
                key={index}
                className="roulette-section"
                style={{
                  transform: `rotate(${rotateAngle}deg) skewY(${skewAngle}deg)`,
                }}
              >
                <div
                  className="roulette-section-container"
                  style={{
                    backgroundColor,
                  }} // Aplicar el color dinámico
                >
                  <p>{text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="button-container">
          <button onClick={spinRoulette} disabled={spinning}>
            ¡Girar!
          </button>
        </div>
      </section>
    );
  };

  export default Roulette;
