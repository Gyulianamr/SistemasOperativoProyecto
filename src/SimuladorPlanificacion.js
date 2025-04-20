import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SimuladorPlanificacion() {
  const [procesos, setProcesos] = useState([]);
  const [nuevoProceso, setNuevoProceso] = useState({
    id: "",
    llegada: "",
    rafaga: "",
    prioridad: ""
  });
  const [resultados, setResultados] = useState([]);
  const [algoritmo, setAlgoritmo] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);
  const [errorArchivo, setErrorArchivo] = useState("");

  const agregarProceso = () => {
    if (!nuevoProceso.id || !nuevoProceso.llegada || !nuevoProceso.rafaga) return;
    setProcesos([...procesos, {
      ...nuevoProceso,
      llegada: parseInt(nuevoProceso.llegada),
      rafaga: parseInt(nuevoProceso.rafaga),
      prioridad: parseInt(nuevoProceso.prioridad) || 0
    }]);
    setNuevoProceso({ id: "", llegada: "", rafaga: "", prioridad: "" });
  };

  const simular = () => {
    switch (algoritmo) {
      case "FCFS":
        simularFCFS(); break;
      case "SJF":
        simularSJF(); break;
      case "RR":
        simularRR(); break;
      case "PRIORIDAD":
        simularPrioridad(); break;
      default:
        break;
    }
  };

  const simularFCFS = () => {
    const ordenado = [...procesos].sort((a, b) => a.llegada - b.llegada);
    let tiempoActual = 0;
    const resultado = ordenado.map((p) => {
      const inicio = Math.max(tiempoActual, p.llegada);
      const fin = inicio + p.rafaga;
      const retorno = fin - p.llegada;
      const espera = inicio - p.llegada;
      const respuesta = espera;
      tiempoActual = fin;
      return { ...p, inicio, fin, retorno, espera, respuesta };
    });
    setResultados(resultado);
  };

  const simularSJF = () => {
    const lista = [...procesos];
    const resultado = [];
    let tiempo = 0;
    while (lista.length > 0) {
      const disponibles = lista.filter(p => p.llegada <= tiempo);
      const siguiente = disponibles.length > 0
        ? disponibles.reduce((a, b) => {
            if (a.rafaga === b.rafaga) {
              return a.id < b.id ? a : b; // Desempate por ID
            }
            return a.rafaga < b.rafaga ? a : b;
          })
        : lista.reduce((a, b) => a.llegada < b.llegada ? a : b);

      if (siguiente.llegada > tiempo) tiempo = siguiente.llegada;
      const inicio = tiempo;
      const fin = inicio + siguiente.rafaga;
      const retorno = fin - siguiente.llegada;
      const espera = inicio - siguiente.llegada;
      const respuesta = espera;
      resultado.push({ ...siguiente, inicio, fin, retorno, espera, respuesta });
      tiempo = fin;
      lista.splice(lista.indexOf(siguiente), 1);
    }
    setResultados(resultado);
  };

  const simularRR = () => {
    const lista = procesos.filter(p => p.rafaga > 0).map(p => ({ ...p }));
    let tiempo = 0, queue = [], resultado = [], map = {};
    const done = new Set();
  
    while (lista.length > 0 || queue.length > 0) {
      // Agregar procesos disponibles a la cola
      lista.filter(p => p.llegada <= tiempo && !done.has(p.id)).forEach(p => {
        queue.push({ ...p });
        done.add(p.id);
      });
  
      // Si la cola está vacía, avanzar el tiempo hasta que llegue un nuevo proceso
      if (queue.length === 0) {
        if (lista.some(p => p.llegada > tiempo)) {
          tiempo = Math.min(...lista.filter(p => p.llegada > tiempo).map(p => p.llegada));
          continue;
        }
        break; // Salir si no quedan más procesos
      }
  
      // Procesar el siguiente proceso en la cola
      const actual = queue.shift();
      if (!map[actual.id]) map[actual.id] = { ...actual, rafagaRestante: actual.rafaga, inicio: tiempo };
      const uso = Math.min(quantum, map[actual.id].rafagaRestante);
      tiempo += uso;
      map[actual.id].rafagaRestante -= uso;
  
      // Agregar procesos recién disponibles a la cola
      lista.filter(p => p.llegada <= tiempo && !done.has(p.id)).forEach(p => {
        queue.push({ ...p });
        done.add(p.id);
      });
  
      // Si el proceso termina, calcular métricas y agregarlo a los resultados
      if (map[actual.id].rafagaRestante === 0) {
        map[actual.id].fin = tiempo;
        map[actual.id].retorno = tiempo - actual.llegada;
        map[actual.id].espera = map[actual.id].inicio - actual.llegada;
        map[actual.id].respuesta = map[actual.id].inicio - actual.llegada;
        resultado.push(map[actual.id]);
      } else {
        queue.push(actual); // Devolver el proceso a la cola si queda ráfaga pendiente
      }
    }
  
    setResultados(resultado);
  };

  const simularPrioridad = () => {
    const lista = [...procesos];
    const resultado = [];
    let tiempo = 0;
    while (lista.length > 0) {
      const disponibles = lista.filter(p => p.llegada <= tiempo);
      const siguiente = disponibles.length > 0
        ? disponibles.reduce((a, b) => {
            if (a.prioridad === b.prioridad) {
              return a.llegada < b.llegada ? a : b; // Desempate por tiempo de llegada
            }
            return a.prioridad < b.prioridad ? a : b;
          })
        : lista.reduce((a, b) => a.llegada < b.llegada ? a : b);

      if (siguiente.llegada > tiempo) tiempo = siguiente.llegada;
      const inicio = tiempo;
      const fin = inicio + siguiente.rafaga;
      const retorno = fin - siguiente.llegada;
      const espera = inicio - siguiente.llegada;
      const respuesta = espera;
      resultado.push({ ...siguiente, inicio, fin, retorno, espera, respuesta });
      tiempo = fin;
      lista.splice(lista.indexOf(siguiente), 1);
    }
    setResultados(resultado);
  };

  const datosGantt = {
    labels: resultados.map(r => r.id),
    datasets: [{
      label: 'Procesos',
      data: resultados.map(r => r.rafaga),
      backgroundColor: 'rgba(250, 0, 183, 0.6)',
      borderColor: 'rgb(114, 3, 129)',
      borderWidth: 1,
    }]
  };

  const opcionesGantt = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { stacked: true, title: { display: true, text: 'Tiempo' } },
      y: { stacked: true }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        let data;
        if (file.name.endsWith(".json")) {
          data = JSON.parse(content);
        } else if (file.name.endsWith(".csv")) {
          const rows = content.split("\n").map(row => row.split(","));
          const headers = rows[0];
          data = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = row[index] ? row[index].trim() : "";
            });
            return obj;
          });
        } else {
          throw new Error("Formato de archivo no soportado. Usa JSON o CSV.");
        }

        // Validar datos
        data.forEach((p, index) => {
          if (!p.id || isNaN(p.llegada) || isNaN(p.rafaga)) {
            throw new Error(`Error en el proceso ${index + 1}: Faltan datos o formato incorrecto.`);
          }
        });

        // Convertir datos y actualizar estado
        setProcesos(data.map(p => ({
          id: p.id,
          llegada: parseInt(p.llegada),
          rafaga: parseInt(p.rafaga),
          prioridad: parseInt(p.prioridad) || 0
        })));
        setErrorArchivo("");
      } catch (error) {
        setErrorArchivo(error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="App">
      <div className="shadow-box container">
        <h1>Simulador de Planificación de Procesos</h1>

        <div className="form-container">
          <h2>Agregar Proceso</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="ID"
              value={nuevoProceso.id}
              onChange={(e) => setNuevoProceso({ ...nuevoProceso, id: e.target.value })}
            />
            <input
              type="number"
              placeholder="Llegada"
              value={nuevoProceso.llegada}
              onChange={(e) => setNuevoProceso({ ...nuevoProceso, llegada: e.target.value })}
            />
            <input
              type="number"
              placeholder="Ráfaga"
              value={nuevoProceso.rafaga}
              onChange={(e) => setNuevoProceso({ ...nuevoProceso, rafaga: e.target.value })}
            />
            <input
              type="number"
              placeholder="Prioridad (opcional)"
              value={nuevoProceso.prioridad}
              onChange={(e) => setNuevoProceso({ ...nuevoProceso, prioridad: e.target.value })}
            />
          </div>
          <div className="input-group">
            <button className="primary" onClick={agregarProceso}>Agregar</button>
            <select value={algoritmo} onChange={e => setAlgoritmo(e.target.value)}>
              <option value="FCFS">FCFS</option>
              <option value="SJF">SJF</option>
              <option value="RR">Round Robin</option>
              <option value="PRIORIDAD">Prioridad</option>
            </select>
            {algoritmo === "RR" && (
              <input
                type="number"
                value={quantum}
                onChange={e => setQuantum(parseInt(e.target.value))}
                placeholder="Quantum"
              />
            )}
            <button className="primary" onClick={simular}>Simular</button>
            <button className="secondary" onClick={() => {
              setProcesos([]);
              setResultados([]);
            }}>Limpiar</button>
            <label htmlFor="file-upload" className="file-upload-label">
              Cargar desde archivo
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json,.csv"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            {errorArchivo && <p className="error">{errorArchivo}</p>}
          </div>
        </div>

        <div className="process-list">
          <h2>Lista de Procesos</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Llegada</th>
                <th>Ráfaga</th>
                <th>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {procesos.map((p, index) => (
                <tr key={index}>
                  <td>{p.id}</td>
                  <td>{p.llegada}</td>
                  <td>{p.rafaga}</td>
                  <td>{p.prioridad || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resultados.length > 0 && (
          <div>
            <h2>Resultados {algoritmo}</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Retorno</th>
                  <th>Espera</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, index) => (
                  <tr key={index}>
                    <td>{r.id}</td>
                    <td>{r.inicio}</td>
                    <td>{r.fin}</td>
                    <td>{r.retorno}</td>
                    <td>{r.espera}</td>
                    <td>{r.respuesta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <h3>Diagrama de Gantt</h3>
              <Bar data={datosGantt} options={opcionesGantt} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}