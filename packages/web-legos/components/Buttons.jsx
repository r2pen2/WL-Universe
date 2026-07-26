import { Button, Text } from "@nextui-org/react"
import "../assets/style/buttons.css"

/**
 *
 * @param {string} text - button text
 * @param {string} color - button color
 * @param {boolean} b - whether to bold text
 * @param {Function} onClick - function to call when clicked
 * @param {string} size - button size
 * @returns
 */
export function LineButton({b, text, onClick, size, color, closed}) {

  function Line() {
    return (
      <div
        className="button-line"
        data-color={color}
        style={{
          "--color": color,
          marginLeft: "1rem",
          marginRight: "1rem",
          height: 1,
        }}
      />
    )
  }

  return (
    <div className={"d-flex flex-row button-line-container align-items-center justify-content-center w-100 " + (closed ? "closed" : "")}>
      <Line />
      <div className="button-line-container">
        <Button
          className="button-line-button"
          size={size}
          onClick={onClick}
          disabled={closed}
          style={{
            filter: closed ? null : `drop-shadow(0px 0px 5px ${color}66)`
          }}
        >
          <Text color="white" b={b}>
            {text}
          </Text>
        </Button>
      </div>
      <Line />
    </div>
  )
}
