import React from 'react';
import { Svg, Path } from 'react-native-svg'; 
interface Props {
  tamano?: number;
  color?: string;
}

export default function LogoPsicologia({ tamano = 72, color = "#8A217A" }: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 100 100">
      <Path
        d="M 38 5 H 62 V 9 C 57 9 55 12 55 20 V 48 C 66 48 78 35 84 12 C 94 20 100 40 85 58 L 70 68 L 82 78 C 90 90 80 100 65 92 C 58 88 55 83 55 78 V 91 C 55 95 58 96 65 96 V 100 H 35 V 96 C 42 96 45 95 45 91 V 78 C 45 83 42 88 35 92 C 20 100 10 90 18 78 L 30 68 L 15 58 C 0 40 6 20 16 12 C 22 35 34 48 45 48 V 20 C 45 12 43 9 38 9 Z"
        fill={color}
      />
    </Svg>
  );
}