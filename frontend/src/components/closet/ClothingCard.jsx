import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export default function ClothingCard({ item }) {
  const { image_url, category, subcategory, confidence } = item || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card hover={true} className="h-full flex flex-col p-3 border-surface-light">
        <div className="aspect-square bg-secondary/70 rounded-xl mb-3 flex items-center justify-center p-2 overflow-hidden relative">
          <img 
            src={image_url} 
            alt={subcategory || category || 'Clothing item'} 
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
          {confidence && (
            <div className="absolute top-2 right-2">
               <Badge variant="success" className="text-[10px] px-1.5 py-0.5 shadow-soft bg-white/90 backdrop-blur-sm">
                 {Math.round(confidence * 100)}%
               </Badge>
            </div>
          )}
        </div>
        <div className="mt-auto px-1">
          <div className="mb-1">
            {category && <Badge variant="pink" className="capitalize text-[10px] px-2 py-0.5">{category}</Badge>}
          </div>
          {subcategory && (
            <p className="text-sm font-semibold text-text-primary capitalize truncate">
              {subcategory}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
