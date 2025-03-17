import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[70vh] bg-white bg-opacity-80">
      <LoadingSpinner 
        size="lg" 
        color="blue" 
        text="Chargement de votre contenu"
      />
    </div>
  );
}
