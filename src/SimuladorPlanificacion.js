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
        ? disponibles.reduce((a, b) => a.rafaga < b.rafaga ? a : b)
        : lista.reduce((a, b) => a.llegada < b.llegada ? a : b);

      if (siguiente.llegada > tiempo) tiempo = siguiente.llegada;
      const inicio = tiempo;
      const fin = inicio + siguiente.rafaga;
      resultado.push({
        ...siguiente,
        inicio,
        fin,
        retorno: fin - siguiente.llegada,
        espera: inicio - siguiente.llegada,
        respuesta: inicio - siguiente.llegada
      });
      tiempo = fin;
      lista.splice(lista.indexOf(siguiente), 1);
    }
    setResultados(resultado);
  };

  const simularRR = () => {
    const lista = procesos.map(p => ({ ...p }));
    let tiempo = 0, queue = [], resultado = [], map = {};
    const done = new Set();

    while (lista.length > 0 || queue.length > 0) {
      lista.filter(p => p.llegada <= tiempo && !done.has(p.id)).forEach(p => {
        queue.push({ ...p });
        done.add(p.id);
      });
      if (queue.length === 0) {
        tiempo++;
        continue;
      }

      const actual = queue.shift();
      if (!map[actual.id]) map[actual.id] = { ...actual, rafagaRestante: actual.rafaga, inicio: tiempo };

      const uso = Math.min(quantum, map[actual.id].rafagaRestante);
      tiempo += uso;
      map[actual.id].rafagaRestante -= uso;

      lista.filter(p => p.llegada <= tiempo && !done.has(p.id)).forEach(p => {
        queue.push({ ...p });
        done.add(p.id);
      });

      if (map[actual.id].rafagaRestante === 0) {
        map[actual.id].fin = tiempo;
        map[actual.id].retorno = tiempo - actual.llegada;
        map[actual.id].espera = (tiempo - actual.llegada) - actual.rafaga;
        map[actual.id].respuesta = map[actual.id].inicio - actual.llegada;
        resultado.push(map[actual.id]);
      } else {
        queue.push(actual);
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
        ? disponibles.reduce((a, b) => a.prioridad < b.prioridad ? a : b)
        : lista.reduce((a, b) => a.llegada < b.llegada ? a : b);

      if (siguiente.llegada > tiempo) tiempo = siguiente.llegada;
      const inicio = tiempo;
      const fin = inicio + siguiente.rafaga;
      resultado.push({
        ...siguiente,
        inicio,
        fin,
        retorno: fin - siguiente.llegada,
        espera: inicio - siguiente.llegada,
        respuesta: inicio - siguiente.llegada
      });
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
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
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