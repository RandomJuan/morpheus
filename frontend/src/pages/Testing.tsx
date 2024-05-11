import React, { useState, useEffect, useRef } from 'react';

// Definimos una interfaz para representar el estado de error
interface ErrorState {
  error: string;
}

// Definimos el tipo de resultado que incluye tanto el resultado exitoso como el estado de error
type Result = { action: string; probability: number; entities_labels: Record<string, string>; } | ErrorState;

// Definir un nuevo tipo para representar las etiquetas con sus posiciones
type LabelWithPosition = {
  label: string;
  start: number;
  end: number;
};

const apiUrl = 'http://127.0.0.1:5000/api/';

export function Testing() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [listOfData, setListOfData] = useState<Record<string, string>>({});
  const [listOfActions, setListOfActions] = useState<string[]>([]);
  const [listOfLabels, setListOfLabels] = useState<string[]>([]);
  const [editingAction, setEditingAction] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(null); // Estado para el índice de la etiqueta seleccionada
  const [labelPositions, setLabelPositions] = useState<LabelWithPosition[]>([]); // Estado para almacenar las etiquetas asignadas a las selecciones de texto
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const response = await fetch(`${apiUrl}getActions`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setListOfData(data);
        const actions = Object.keys(data);
        setListOfActions(actions);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchActions();
  }, []);

  useEffect(() => {
    // Cargar las etiquetas basadas en la acción seleccionada
    if (selectedAction && listOfData[selectedAction]) {
      const labels = Object.keys(listOfData[selectedAction]);
      setListOfLabels(labels);
    }
  }, [selectedAction, listOfData]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleAnalyze = async () => {
    try {
      const response = await fetch(`${apiUrl}analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      setResult(data);
      if (data.action) {
        setSelectedAction(data.action); // Preseleccionar la acción devuelta por el análisis
      }
    } catch (error) {
      console.error('Error:', error);
      // Mostrar el mensaje de error en el estado del resultado
      setResult({ error: 'Se produjo un error al analizar el texto. Por favor, inténtelo de nuevo más tarde.' });
    }
  };

  const handleActionChange = (selectedAction: string) => {
    setSelectedAction(selectedAction);
    if (listOfData[selectedAction]) {
      const labels = Object.keys(listOfData[selectedAction]);
      setListOfLabels(labels);
    }
  };

  const handleEditAction = () => {
    setEditingAction(true);
    if (textAreaRef.current) {
      setSelectedText(textAreaRef.current.value.substring(textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd));
    }
  };

  // Actualizar la función para guardar la acción con la etiqueta y su posición
  const handleSaveAction = () => {
    // Verificar si hay texto seleccionado y una etiqueta seleccionada
    if (selectedText && selectedLabelIndex !== null) {
      const label = listOfLabels[selectedLabelIndex];
      const start = textAreaRef.current?.selectionStart;
      const end = textAreaRef.current?.selectionEnd;

      if (start !== undefined && end !== undefined) {
        // Función para verificar si ya existe una etiqueta asignada a la misma posición
        const labelExists = (start: number, end: number) => {
          return labelPositions.some(position => {
            return (start >= position.start && start <= position.end) || (end >= position.start && end <= position.end);
          });
        };

        // Actualizar el estado de las etiquetas asignadas con la nueva etiqueta y posición, verificando si ya existe una etiqueta en la misma posición
        const updateLabelPositions = (start: number, end: number, label: string) => {
          if (!labelExists(start, end)) {
            setLabelPositions([...labelPositions, { label, start, end }]);
          } else {
            // Aquí puedes manejar el caso cuando ya existe una etiqueta en la misma posición (por ejemplo, sobrescribir la etiqueta existente o mostrar un mensaje de error)
            console.error('Ya existe una etiqueta asignada a la misma posición.');
          }
        };

        updateLabelPositions(start, end, label);
      }
    }
  };

  const saveCorrectData = async () => {
    try {
      const response = await fetch(`${apiUrl}save_correct_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText, action: selectedAction, entities: labelPositions }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
    } catch (error) {
      console.error('Error:', error);
      // Mostrar el mensaje de error en el estado del resultado
      setResult({ error: 'Se produjo un error al analizar el texto. Por favor, inténtelo de nuevo más tarde.' });
    }
  };

  const handleTextSelection = () => {
    if (textAreaRef.current) {
      setSelectedText(textAreaRef.current.value.substring(textAreaRef.current.selectionStart, textAreaRef.current.selectionEnd));
    }
  };

  const handleLabelSelection = (index: number) => {
    setSelectedLabelIndex(index); // Actualizar el índice de la etiqueta seleccionada
  };

  const renderIfResult = () => {
    if (result) {
      if ('error' in result) {
        return (
          <div>
            <h2>Error:</h2>
            <p>{result.error}</p>
          </div>
        );
      }
  
      return (
        <>
          <button onClick={handleEditAction} style={{ backgroundColor: 'red', color: 'white' }}>&#10006;</button>
          <button onClick={handleEditAction} style={{ backgroundColor: 'green', color: 'white' }}>&#10004;</button>
          <div>
            <h2>Resultado:</h2>
            <p>Funcionalidad: {result.action}</p>
            {renderSelectAction()}
            <p>Probabilidad: {result.probability}</p>
            <h3>Entidades:</h3>
            <ul>
              {Object.entries(result.entities_labels).map(([key, value], index) => (
                <li key={index}>{value[0]} - {value[1]}</li>
              ))}
            </ul>
          </div>
        </>
      );
    }
  };

  const renderSelectAction = () => {
    if (editingAction) {
      return (
        <div>
          <select
            value={selectedAction}
            onChange={(e) => handleActionChange(e.target.value)}
          >
            <option value="">Seleccionar acción</option>
            {listOfActions.map((action, index) => (
              <option key={index} value={action}>{action}</option>
            ))}
          </select>
        </div>
      );
    }
  };

  const renderSelectLabels = () => {
    if (editingAction) {
      return (
        <select
          onChange={(e) => handleLabelSelection(parseInt(e.target.value))}
        >
          <option value="">Seleccionar etiqueta</option>
          {listOfLabels.map((label, index) => (
            <option key={index} value={index}>{label}</option>
          ))}
        </select>
      );
    }
  };

  // Renderizar el array de etiquetas y posiciones dentro del menú de edición
  const renderLabelPositions = () => {
    if (labelPositions.length > 0) {
      return (
        <div style={{ marginTop: '10px' }}>
          <h3>Labels y Posiciones:</h3>
          <ul>
            {labelPositions.map((position, index) => (
              <li key={index}>{position.label} - ({position.start}, {position.end}) - {inputText.substring(position.start, position.end)}</li>
            ))}
          </ul>
        </div>
      );
    }
  };
  
  // Renderizar el botón para guardar los datos corregidos
  const renderSaveButton = () => {
    return (
      <button onClick={saveCorrectData}>Guardar</button>
    );
  };

  return (
    <div>
      <h1>Analizador de Texto</h1>
      <input
        type="text"
        value={inputText}
        style={{width:"40%"}}
        onChange={handleInputChange}
        placeholder="Ingrese el texto a analizar"
      />
      <button onClick={handleAnalyze} style={{ marginRight: '5px' }}>Analizar</button>
      {renderIfResult()}
      {editingAction && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
          <textarea
            ref={textAreaRef}
            value={inputText}
            onChange={() => {}}
            onSelect={handleTextSelection}
            style={{ width: "40%", height: "30px" }} // 40% para el textarea
          />
          <div style={{ marginLeft: '10px', marginRight: '6%' , width: "10%" }}> {/* 30% para el drop down */}
            {renderSelectLabels()} {/* Renderizar el dropdown de etiquetas */}
          </div>
          <button onClick={handleSaveAction} style={{ width: "10%", marginLeft: '5px' }}>Set Label</button> {/* 20% para el botón */}
          <button onClick={saveCorrectData} style={{ width: "15%", marginLeft: '5px' }}>Clear Selected Labels</button> {/* 20% para el botón */}
        </div>
      )}
      {editingAction && (
        <div style={{ marginTop: '10px' }}>
          <label>Texto Seleccionado: {selectedText}</label>
        </div>
      )}
      {editingAction && (
        renderLabelPositions()
      )}
      {editingAction && (
        renderSaveButton()
      )}
    </div>
  );
}
