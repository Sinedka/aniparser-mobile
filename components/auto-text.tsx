import React, { useState, useCallback, useEffect } from "react";
import { Text, View, StyleProp, TextStyle } from "react-native";

type AutoTextProps = {
  text: string;
  maxFontSize: number;
  minFontSize: number;
  maxHeight: number;
  tail?: string; // "...", "-1"
  style?: StyleProp<TextStyle>;
};

export const AutoText: React.FC<AutoTextProps> = ({
  text,
  maxFontSize,
  minFontSize,
  maxHeight,
  tail = "...",
  style,
}) => {
  const [low, setLow] = useState(minFontSize);
  const [high, setHigh] = useState(maxFontSize);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [bestSize, setBestSize] = useState(minFontSize);
  const [done, setDone] = useState(false);
  const [displayText, setDisplayText] = useState(text);

  // старт бинарного поиска
  useEffect(() => {
    setLow(minFontSize);
    setHigh(maxFontSize);
    setFontSize(Math.floor((minFontSize + maxFontSize) / 2));
    setBestSize(minFontSize);
    setDone(false);
    setDisplayText(text);
  }, [text, minFontSize, maxFontSize]);

  const onTextLayout = useCallback(
    (e: any) => {
      if (done) return;

      const lines = e.nativeEvent.lines;
      const textHeight = lines.reduce(
        (sum: number, line: any) => sum + line.height,
        0
      );

      const fits = textHeight <= maxHeight;

      if (fits) {
        setBestSize(fontSize);
        const nextLow = fontSize + 1;

        if (nextLow > high) {
          setFontSize(fontSize);
          setDone(true);
          return;
        }

        setLow(nextLow);
        setFontSize(Math.floor((nextLow + high) / 2));
      } else {
        const nextHigh = fontSize - 1;

        if (nextHigh < low) {
          // бинпоиск закончен
          if (tail !== "-1" && bestSize === minFontSize) {
            // обрезаем текст
            let visibleText = "";
            for (const line of lines) {
              if (line.y + line.height <= maxHeight) {
                visibleText += line.text;
              }
            }
            setDisplayText(visibleText.trimEnd() + tail);
          }

          setFontSize(bestSize);
          setDone(true);
          return;
        }

        setHigh(nextHigh);
        setFontSize(Math.floor((low + nextHigh) / 2));
      }
    },
    [
      done,
      fontSize,
      low,
      high,
      bestSize,
      maxHeight,
      minFontSize,
      tail,
    ]
  );

  return (
    <View style={{ maxHeight }}>
      <Text
        onTextLayout={onTextLayout}
        style={[
          style,
          {
            fontSize,
            lineHeight: fontSize * 1.2,
          },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

