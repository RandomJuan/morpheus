import React, { useState, useEffect } from 'react';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();
mic.continuous = true;
mic.interimResults = true;
mic.lang = 'es-LA';

export function Speaker() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let ignoreNextEnd = false;

    const handleListen = () => {
      if (isListening) {
        if (!ignoreNextEnd) {
          mic.start();
        }
        ignoreNextEnd = false;

        mic.onend = () => {
          console.log('continue..');
          handleListen(); // Reinicia el reconocimiento después de un final
        };
      } else {
        mic.stop();
        mic.onend = () => {
          console.log('Stopped Mic on Click');
        };
      }

      mic.onstart = () => {
        console.log('Mics on');
      };

      mic.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        console.log(transcript);
        setNote(transcript);
        mic.onerror = (event) => {
          console.log(event.error);
        };
      };
    };

    handleListen(); // Llamada inicial al montar el componente

    // Limpieza
    return () => {
      ignoreNextEnd = true;
      mic.stop();
    };
  }, [isListening]);

  return (
    <>
      <BootstrapSwitchButton 
        checked={isListening}
        onlabel='SpeakOn'
        offlabel='SpeakOff'
        width={100}
        onChange={() => setIsListening((prevState) => !prevState)}
        offstyle="danger"
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          padding: '10px',
          fontSize: '1.5em',
        }}
      >
        <p>{note}</p>
      </div>
    </>
  );
}
