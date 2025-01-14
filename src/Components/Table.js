import React from "react";
// import "./Table.css";

const Table = ({ title, data, columns }) => (
  <div className="table-container">
    <h2 className="heading">{title}</h2>
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((col, colIndex) => (
              <td key={colIndex}>
                {col.key === "action" ? (
                  <button className="update-button">Update</button>
                ) : (
                  row[col.key]
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
