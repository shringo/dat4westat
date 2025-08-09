import { useState } from 'react'
import './App.css'
import convertFile from './convert';

function App() {

  // this functions but doesn't work(?)
  const [error, setErr] = useState<string>();
  const [file, setFile] = useState<string>();
  const [isMS, setMS] = useState(false);

  return (
    <>
      <title>.dat Converter</title>
      <h1>.dat Converter</h1>
      <p>Convert Health Surveys .csv to a .dat file</p>

      <h2>Instructions</h2>
      <ol style={{ textAlign: "left" }}>
        <li>Make sure the first row has a header (numbers for each question)</li>
        <li>Make sure the first column is the first question/answer for the survey</li>
        <li>Make sure you removed any extraneous columns and rows from the CSV</li>
        <li>Follow the UI below. Your .dat file will be automatically downloaded.</li>
      </ol>

      <div>
        The table you export should look like this*:
        <table style={{
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          <tbody>
            <tr>
              <th>Q1</th>
              <th>Q2</th>
              <th>Q3</th>
              <th>Q4</th>
              <th>...</th>
              <th>Q87 <sup>(Final)</sup></th>
              <th>PCSampleID</th>
            </tr>
            <tr>
              <td>4</td>
              <td>1</td>
              <td>3</td>
              <td>2,8</td>
              <td>...</td>
              <td>5</td>
              <td>30100101</td>
            </tr>
            <tr>
              <td>6</td>
              <td>3</td>
              <td>2</td>
              <td>1,4,7</td>
              <td>...</td>
              <td>2</td>
              <td>30100102</td>
            </tr>
            <tr>
              <td>1</td>
              <td>6</td>
              <td>5</td>
              <td>4</td>
              <td>...</td>
              <td>2</td>
              <td>30100103</td>
            </tr>
            <tr>
              <td>5</td>
              <td>7</td>
              <td>2</td>
              <td>3,7,8</td>
              <td>...</td>
              <td>1</td>
              <td>30100104</td>
            </tr>
            <tr>
              <td>3</td>
              <td>3</td>
              <td>2</td>
              <td>3,4</td>
              <td>...</td>
              <td>2</td>
              <td>30100105</td>
            </tr>
          </tbody>
        </table>
        <i>*: Column header text does not need to be the same.</i>
      </div>

      <div>
        Drag or select the .csv file here: <input type="file" onChange={async (e) => {
          const file = e.target.files?.[0];
          if(!file) return;
          const reader = new FileReader();
          reader.readAsText(file, "utf-8");
          reader.onload = (e) => {
            const result = e.target?.result;
            if(typeof result !== "string") return setErr("File was read but error occurred getting result.");
            setFile(result);
          }
          reader.onerror = (e) => {
            console.log(e);
            setErr("Error reading file");
          }

        }}/><br/>
        Is this for middle school? <input type="checkbox" onChange={(e) => setMS((e.target as HTMLInputElement).checked)}/><br/>
        {error && <div style={{ color: "#d00" }}>
          <h2 style={{ marginBottom: '0', color: "red" }}>ERROR</h2>
          {error}
        </div>}
        <input type="button" value="Convert!" onClick={() => {
          if(file === undefined) return setErr("No file given");
          const result = convertFile(file, isMS);
          if(typeof result === "string") return setErr(result);

          const date = new Date();

          const a = document.createElement('a');
          const blobURL = URL.createObjectURL(result);
          a.setAttribute('href', blobURL);
          a.setAttribute('download', `${isMS ? 'MS' : 'HS'}-${date.toLocaleString('en-US', { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("-","_")}.dat`);
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobURL);
        }}/>
      </div>
    </>
  )
}

export default App
