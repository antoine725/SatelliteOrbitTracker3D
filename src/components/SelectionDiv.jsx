export default function SelectionDiv({ classParam, id, satName, isChecked, onChange }) {
  return (
    <div className={classParam}>
      <input 
        type="checkbox" 
        id={id} 
        name={satName} 
        value={satName}
        checked={isChecked}
        onChange={onChange}
      />
      <label htmlFor={id}>{satName}</label>
    </div>
  );
}