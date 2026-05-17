global.WebSocket = class {};
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const getEnvVal = (key) => {
  const match = envFile.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVal('EXPO_PUBLIC_SUPABASE_URL') || getEnvVal('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const targetBusinessId = '9fa70861-ec45-4943-8661-3ac8ea81909b';
  console.log("Fetching the target business Virat Saloon...");
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, salon_name')
    .eq('id', targetBusinessId)
    .limit(1);

  if (bizError || !businesses || businesses.length === 0) {
    console.error("❌ Failed to fetch business:", bizError);
    return;
  }

  const business = businesses[0];
  console.log(`✅ Selected Business: ${business.salon_name} (ID: ${business.id})`);

  console.log("Fetching services for this business...");
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id, name, price_cents')
    .eq('business_id', business.id)
    .limit(1);

  if (serviceError || !services || services.length === 0) {
    console.error("❌ Failed to fetch services:", serviceError);
    return;
  }

  const service = services[0];
  console.log(`✅ Selected Service: ${service.name} (ID: ${service.id}, Price: ${service.price_cents / 100})`);

  console.log("Creating a brand new available slot far in the future...");
  const dateStr = '2027-12-25';
  const start_time = '10:00:00';
  const end_time = '10:30:00';

  const { data: slot, error: createSlotError } = await supabase
    .from('slots')
    .insert({
      business_id: business.id,
      date: dateStr,
      start_time: start_time,
      end_time: end_time,
      status: 'available'
    })
    .select()
    .single();

  if (createSlotError && createSlotError.code !== '23505') {
    console.error("❌ Failed to create slot:", createSlotError);
    return;
  }

  let finalSlot = slot;
  if (createSlotError && createSlotError.code === '23505') {
    console.log("Slot already exists, fetching it...");
    const { data: existingSlot, error: fetchSlotError } = await supabase
      .from('slots')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', dateStr)
      .eq('start_time', start_time)
      .single();

    if (fetchSlotError) {
      console.error("❌ Failed to fetch existing slot:", fetchSlotError);
      return;
    }
    finalSlot = existingSlot;
  }

  console.log(`✅ Selected Slot: ${finalSlot.date} ${finalSlot.start_time} - ${finalSlot.end_time} (ID: ${finalSlot.id})`);

  console.log("Inserting a customer booking for Karthik...");
  const customerUserId = '640f8455-7bf5-494b-a725-9c55ed34322b';
  
  // Let's generate a unique booking reference ID
  const bookingRef = `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      business_id: business.id,
      slot_id: finalSlot.id,
      customer_name: 'Karthik Naramala',
      customer_phone: '+919949740776',
      booking_id: bookingRef,
      status: 'confirmed',
      customer_user_id: customerUserId,
      total_duration_minutes: 30,
      total_price_cents: service.price_cents,
      services_count: 1,
      slot_start: finalSlot.start_time,
      slot_end: finalSlot.end_time,
    })
    .select()
    .single();

  if (bookingError) {
    console.error("❌ Failed to insert booking:", bookingError);
    return;
  }

  console.log(`✅ Booking successfully created! ID: ${booking.id}, Booking Ref: ${booking.booking_id}`);

  console.log("Linking booking service relationship...");
  const { error: bookingServiceError } = await supabase
    .from('booking_services')
    .insert({
      booking_id: booking.id,
      service_id: service.id,
      price_cents: service.price_cents
    });

  if (bookingServiceError) {
    console.error("❌ Failed to link booking service:", bookingServiceError);
    return;
  }

  console.log("🎉 Booking and service mapping successfully created!");
}

check();
