import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Text, Circle } from 'react-konva';
import axios from 'axios';

const KonvaImages = () => {
  const [images, setImages] = useState([]);
  const [konvaImages, setKonvaImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // Stato per tracciare l'immagine selezionata

  useEffect(() => {
    // Chiamata all'API per ottenere le immagini
    axios
      .get('http://localhost:5000/api/images') // URL dell'API
      .then((response) => {
        setImages(response.data); // Salva le immagini nel state
      })
      .catch((error) => {
        console.error('Errore nel recupero delle immagini:', error);
      });
  }, []);

  const imageWidth = 100;
  const imageHeight = 100;
  const minDistance = 100; // Distanza minima tra le immagini

  // Funzione per calcolare una posizione valida
  const generateRandomPosition = () => {
    let x, y;
    let validPosition = false;

    while (!validPosition) {
      x = Math.random() * (1024 - imageWidth); // Calcola una posizione casuale dentro il canvas
      y = Math.random() * (768  - imageHeight); // Calcola una posizione casuale dentro il canvas

      // Verifica che la posizione non si sovrapponga con altre immagini
      validPosition = konvaImages.every(
        (image) =>
          Math.abs(image.x - x) > minDistance && Math.abs(image.y - y) > minDistance
      );
    }

    return { x, y };
  };

  useEffect(() => {
    if (images.length > 0) {
      const loadedImages = images.map((imageData) => {
        const img = new window.Image();
        img.src = imageData.url;

        return new Promise((resolve) => {
          img.onload = () => resolve({
            image: img,
            number: imageData.number,
            id: imageData._id,
            ...generateRandomPosition(), // Genera una posizione valida
          });
        });
      });

      Promise.all(loadedImages).then((imagesWithInfo) => {
        setKonvaImages(imagesWithInfo); // Salva le immagini caricate con le loro posizioni
      });
    }
  }, [images]);

  // Funzione per gestire il click sull'immagine
  const handleImageClick = (id) => {
    if (selectedImage === id) {
      setSelectedImage(null); // Se l'immagine selezionata è cliccata di nuovo, deselezionala
    } else {
      setSelectedImage(id); // Se l'immagine non è selezionata, selezionala
    }
  };

  // Funzione per gestire il drag dell'immagine
  const handleDragMove = (e, imageId) => {
    if (selectedImage && selectedImage !== imageId) {
      return; // Non muovere immagini non selezionate
    }

    const newX = Math.max(0, Math.min(e.target.x(), 1024 - imageWidth)); // Limita la posizione orizzontale
    const newY = Math.max(0, Math.min(e.target.y(), 768 - imageHeight)); // Limita la posizione verticale

    // Verifica se la nuova posizione si sovrappone con altre immagini
    let validPosition = true;
    konvaImages.forEach((konvaImage) => {
      if (
        konvaImage.id !== imageId && // Non controllare se stessa
        Math.abs(konvaImage.x - newX) < minDistance &&
        Math.abs(konvaImage.y - newY) < minDistance
      ) {
        validPosition = false;
      }
    });

    // Se la posizione non è valida (sovrapposta), ripristina la posizione precedente
    if (validPosition) {
      const updatedImages = konvaImages.map((konvaImage) => {
        if (konvaImage.id === imageId) {
          return { ...konvaImage, x: newX, y: newY }; // Usa le posizioni limitate
        }
        return konvaImage;
      });
      setKonvaImages(updatedImages);
    }
  };

  return (
    <div>
      <Stage width={1024} height={768}>
        <Layer>
          {konvaImages.map((konvaImage, index) => {
            const isSelected = konvaImage.id === selectedImage;

            return (
              <React.Fragment key={index}>
                <Image
                  image={konvaImage.image}
                  x={konvaImage.x}
                  y={konvaImage.y}
                  width={imageWidth}
                  height={imageHeight}
                  draggable={isSelected} // Solo l'immagine selezionata può essere draggata
                  //draggable="true" 
                  onClick={() => handleImageClick(konvaImage.id)}
                  onDragMove={(e) => handleDragMove(e, konvaImage.id)}
                />
                <Text
                  text={`${konvaImage.number}`}
                  x={konvaImage.x}
                  y={konvaImage.y + 10}
                  fontSize={10}
                  fontFamily="Arial"
                  fill="white"
                  padding={10}
                />
                {isSelected && (
                  <Circle
                    x={konvaImage.x + imageWidth / 2}
                    y={konvaImage.y + imageHeight / 2}
                    radius={50}
                    stroke="red"
                    strokeWidth={5}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaImages;
