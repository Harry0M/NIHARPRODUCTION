
import { OrderEditForm, OrderEditHeader, LoadingSpinner, useOrderEdit } from "./components/OrderEdit";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

const OrderEdit = () => {
  const {
    id,
    navigate,
    formData,
    formErrors,
    components,
    customComponents,
    loading,
    submitting,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleSubmit
  } = useOrderEdit();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <OrderEditHeader onBack={() => navigate(`/orders/${id}`)} />
      
      <OrderEditForm
        formData={formData}
        formErrors={formErrors}
        components={components}
        customComponents={customComponents}
        componentOptions={componentOptions}
        submitting={submitting}
        handleOrderChange={handleOrderChange}
        handleComponentChange={handleComponentChange}
        handleCustomComponentChange={handleCustomComponentChange}
        addCustomComponent={addCustomComponent}
        removeCustomComponent={removeCustomComponent}
        handleSubmit={handleSubmit}
        onCancel={() => navigate(`/orders/${id}`)}
      />
    </div>
  );
};

export default OrderEdit;
