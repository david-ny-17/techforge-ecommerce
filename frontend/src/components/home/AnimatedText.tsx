import { Fragment } from "react"
import { motion, useReducedMotion } from "motion/react"
import type { Variants } from "motion/react"

interface AnimatedTextProps {
  text: string
  className?: string
  letterClassName?: string
  delay?: number
  stagger?: number
}

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export default function AnimatedText({
  text,
  className,
  letterClassName = "",
  delay = 0,
  stagger = 0.04,
}: AnimatedTextProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <span className={className}>
        <span className={letterClassName}>{text}</span>
      </span>
    )
  }

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
  }

  const words = text.split(" ")

  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Los lectores de pantalla leen el texto completo, no letra por letra */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <Fragment key={wordIndex}>
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  variants={letterVariants}
                  className={`inline-block ${letterClassName}`}
                >
                  {char}
                </motion.span>
              ))}
            </span>
            {wordIndex < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </motion.span>
  )
}