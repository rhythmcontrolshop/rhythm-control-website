import React from 'react';

type GridProps = {
  children: React.ReactNode;
  className?: string;
};

export const Grid = ({ children, className = '' }: GridProps) => {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-6 gap-[2px] bg-white ${className}`}
    >
      {children}
    </div>
  );
};
