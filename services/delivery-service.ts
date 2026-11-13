import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { offlineStorage } from '@/lib/offline-storage';
import {
  DeliveryAssignment,
  DeliveryAssignmentStatus,
  Order,
  Warehouse,
} from '@/types';

export const deliveryService = {
  // ========================================================
  // 1. GET ASSIGNED DELIVERIES FOR DELIVERY PILOT
  // ========================================================
  async getAssignedDeliveries(
    deliveryPersonId: string,
    filterStatus?: string
  ): Promise<DeliveryAssignment[]> {
    if (!isSupabaseConfigured || !deliveryPersonId) {
      return await offlineStorage.getDeliveries();
    }

    try {
      let query = supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            store_id,
            salesperson_id,
            order_date,
            discount_amount,
            tax_amount,
            total_amount,
            notes,
            status,
            rejection_reason,
            confirmed_by,
            confirmed_at,
            created_at,
            updated_at,
            store:stores (*),
            items:order_items (
              id,
              order_id,
              product_id,
              quantity,
              delivered_quantity,
              unit_price,
              total_price,
              created_at,
              product:products (*)
            )
          )
        `)
        .eq('delivery_person_id', deliveryPersonId)
        .order('assigned_date', { ascending: false });

      if (filterStatus && filterStatus !== 'all') {
        if (filterStatus === 'pending') {
          query = query.in('status', ['assigned']);
        } else if (filterStatus === 'ready_for_pickup') {
          query = query.eq('status', 'assigned');
        } else if (filterStatus === 'out_for_delivery') {
          query = query.eq('status', 'in_transit');
        } else {
          query = query.eq('status', filterStatus);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Delivery fetch error, falling back to cache:', error);
        return await offlineStorage.getDeliveries();
      }

      const deliveries = (data || []) as DeliveryAssignment[];
      // Cache for offline resiliency
      await offlineStorage.saveDeliveries(deliveries);
      return deliveries;
    } catch (err) {
      console.warn('Network exception while fetching deliveries, using cache:', err);
      return await offlineStorage.getDeliveries();
    }
  },

  // ========================================================
  // 2. GET SINGLE DELIVERY BY ASSIGNMENT ID
  // ========================================================
  async getDeliveryById(
    assignmentId: string,
    deliveryPersonId?: string
  ): Promise<DeliveryAssignment | null> {
    try {
      let query = supabase
        .from('delivery_assignments')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            store_id,
            salesperson_id,
            order_date,
            discount_amount,
            tax_amount,
            total_amount,
            notes,
            status,
            rejection_reason,
            confirmed_by,
            confirmed_at,
            created_at,
            updated_at,
            store:stores (*),
            items:order_items (
              id,
              order_id,
              product_id,
              quantity,
              delivered_quantity,
              unit_price,
              total_price,
              created_at,
              product:products (*)
            )
          )
        `)
        .eq('id', assignmentId);

      if (deliveryPersonId) {
        query = query.eq('delivery_person_id', deliveryPersonId);
      }

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        const cached = await offlineStorage.getDeliveries();
        return cached.find((d) => d.id === assignmentId) || null;
      }

      // Populate salesperson details if present
      if (data.order?.salesperson_id) {
        const { data: sp } = await supabase
          .from('sales_person_profiles')
          .select('id, name, employee_id, mobile')
          .eq('id', data.order.salesperson_id)
          .maybeSingle();
        if (sp) {
          (data.order as any).salesperson = sp;
        }
      }

      return data as DeliveryAssignment;
    } catch (err) {
      console.warn('Error fetching delivery by ID:', err);
      const cached = await offlineStorage.getDeliveries();
      return cached.find((d) => d.id === assignmentId) || null;
    }
  },

  // ========================================================
  // 3. GET WAREHOUSE DETAILS (For Central FMCG Godown)
  // ========================================================
  async getCentralWarehouse(): Promise<Warehouse> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        return data as Warehouse;
      }
    } catch {
      // Fallback to default
    }

    // Standard Aarvi Central FMCG Godown fallback
    return {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Central FMCG Godown',
      code: 'WH-MAIN-01',
      address: 'Plot 42, Industrial Area Phase 1',
      city: 'Rajkot / New Delhi',
      contact_person: 'Harish Sharma',
      contact_mobile: '9811002233',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // ========================================================
  // 4. CONFIRM WAREHOUSE PICKUP
  // ========================================================
  async confirmPickup(params: {
    assignmentId: string;
    orderId: string;
    deliveryPersonId: string;
    deliveryPersonName: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> {
    const now = new Date().toISOString();

    try {
      // 1. Validate that assignment belongs to this delivery pilot
      const { data: assignment, error: assignErr } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('id', params.assignmentId)
        .eq('delivery_person_id', params.deliveryPersonId)
        .single();

      if (assignErr || !assignment) {
        return {
          success: false,
          message: 'Delivery assignment not found or unauthorized for your account.',
        };
      }

      // 2. Fetch order to verify eligibility
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.orderId)
        .single();

      if (orderErr || !order) {
        return { success: false, message: 'Order record not found.' };
      }

      // 3. Update delivery assignment status to in_transit
      const { error: updateAssignErr } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'in_transit',
          delivery_notes: params.notes ? `[Pickup] ${params.notes}` : assignment.delivery_notes,
          updated_at: now,
        })
        .eq('id', params.assignmentId);

      if (updateAssignErr) throw updateAssignErr;

      // 4. Update order status to out_for_delivery
      const { error: updateOrderErr } = await supabase
        .from('orders')
        .update({
          status: 'out_for_delivery',
          updated_at: now,
        })
        .eq('id', params.orderId);

      if (updateOrderErr) throw updateOrderErr;

      // 5. Update inventory reservation to dispatched status safely
      // (This marks the warehouse stock as physically handed over to the pilot)
      try {
        await supabase
          .from('inventory_reservations')
          .update({
            status: 'dispatched',
            updated_at: now,
          })
          .eq('order_id', params.orderId)
          .eq('status', 'active');
      } catch (e) {
        console.warn('Inventory reservation update non-critical notice:', e);
      }

      // 6. Record Stock Movement (dispatch)
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', params.orderId);

        if (items && items.length > 0) {
          const movements = items.map((item) => ({
            product_id: item.product_id,
            movement_type: 'dispatch',
            quantity: item.quantity,
            reference_type: 'orders',
            reference_id: params.orderId,
            notes: `Dispatched to pilot ${params.deliveryPersonName} for ${order.order_number}`,
            created_by: params.deliveryPersonName,
            created_at: now,
          }));
          await supabase.from('stock_movements').insert(movements);
        }
      } catch (e) {
        console.warn('Stock movement non-critical notice:', e);
      }

      // 7. Insert Notification for Admin / Store
      try {
        await supabase.from('notifications').insert([
          {
            title: 'Order Dispatched from Godown',
            message: `Order ${order.order_number} has been picked up from the warehouse by ${params.deliveryPersonName} and is now out for delivery.`,
            type: 'delivery',
            reference_type: 'orders',
            reference_id: params.orderId,
            is_read: false,
          },
        ]);
      } catch (e) {
        console.warn('Notification insert notice:', e);
      }

      return {
        success: true,
        message: 'Warehouse pickup confirmed. The order is now out for delivery!',
      };
    } catch (err: any) {
      console.error('Confirm pickup error:', err);
      return {
        success: false,
        message: err.message || 'Failed to confirm warehouse pickup. Please check network connection.',
      };
    }
  },

  // ========================================================
  // 5. START DELIVERY / IN-TRANSIT UPDATE
  // ========================================================
  async startDelivery(params: {
    assignmentId: string;
    orderId: string;
    deliveryPersonId: string;
  }): Promise<{ success: boolean; message: string }> {
    const now = new Date().toISOString();
    try {
      await supabase
        .from('delivery_assignments')
        .update({
          status: 'in_transit',
          updated_at: now,
        })
        .eq('id', params.assignmentId)
        .eq('delivery_person_id', params.deliveryPersonId);

      await supabase
        .from('orders')
        .update({
          status: 'out_for_delivery',
          updated_at: now,
        })
        .eq('id', params.orderId);

      return { success: true, message: 'Transit started towards the retail outlet.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Could not update transit status.' };
    }
  },

  // ========================================================
  // 6. COMPLETE DELIVERY (FULL OR PARTIAL DROP)
  // ========================================================
  async completeDelivery(params: {
    assignmentId: string;
    orderId: string;
    deliveryPersonId: string;
    deliveryPersonName: string;
    lineItemDeliveries: {
      orderItemId: string;
      productId: string;
      orderedQty: number;
      deliveredQty: number;
    }[];
    notes?: string;
  }): Promise<{ success: boolean; isPartial: boolean; message: string }> {
    const now = new Date().toISOString();

    try {
      // 1. Validate quantities: cannot be negative or exceed ordered quantity
      for (const item of params.lineItemDeliveries) {
        if (item.deliveredQty < 0) {
          return {
            success: false,
            isPartial: false,
            message: 'Delivered quantity cannot be negative.',
          };
        }
        if (item.deliveredQty > item.orderedQty) {
          return {
            success: false,
            isPartial: false,
            message: `Delivered quantity (${item.deliveredQty}) exceeds ordered quantity (${item.orderedQty}).`,
          };
        }
      }

      // Determine if fully or partially delivered
      let totalOrdered = 0;
      let totalDelivered = 0;
      for (const item of params.lineItemDeliveries) {
        totalOrdered += item.orderedQty;
        totalDelivered += item.deliveredQty;
      }

      const isPartial = totalDelivered < totalOrdered;
      const finalStatus: DeliveryAssignmentStatus = isPartial ? 'partially_delivered' : 'delivered';
      const orderFinalStatus = isPartial ? 'partially_delivered' : 'delivered';

      // 2. Update each order item's delivered_quantity in Supabase
      for (const item of params.lineItemDeliveries) {
        const { error: itemErr } = await supabase
          .from('order_items')
          .update({
            delivered_quantity: item.deliveredQty,
          })
          .eq('id', item.orderItemId);

        if (itemErr) throw itemErr;

        // Deduct actual delivered stock from inventory current_stock
        try {
          const { data: inv } = await supabase
            .from('inventory')
            .select('*')
            .eq('product_id', item.productId)
            .maybeSingle();

          if (inv) {
            const newCurrentStock = Math.max(0, inv.current_stock - item.deliveredQty);
            const newReservedStock = Math.max(0, inv.reserved_stock - item.orderedQty);
            // If partial delivery, return the undelivered items back to available stock
            const undeliveredQty = item.orderedQty - item.deliveredQty;
            const newAvailableStock = inv.available_stock + undeliveredQty;

            await supabase
              .from('inventory')
              .update({
                current_stock: newCurrentStock,
                reserved_stock: newReservedStock,
                available_stock: newAvailableStock,
                updated_at: now,
              })
              .eq('product_id', item.productId);
          }
        } catch (invErr) {
          console.warn('Inventory stock level adjustment notice:', invErr);
        }
      }

      // 3. Update Delivery Assignment status
      const { error: assignErr } = await supabase
        .from('delivery_assignments')
        .update({
          status: finalStatus,
          delivery_notes: params.notes || null,
          completed_at: now,
          updated_at: now,
        })
        .eq('id', params.assignmentId)
        .eq('delivery_person_id', params.deliveryPersonId);

      if (assignErr) throw assignErr;

      // 4. Update Order status
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          status: orderFinalStatus,
          updated_at: now,
        })
        .eq('id', params.orderId);

      if (orderErr) throw orderErr;

      // 5. Fetch order info for notification and audit
      const { data: order } = await supabase
        .from('orders')
        .select('order_number, store_id')
        .eq('id', params.orderId)
        .single();

      // 6. Record notification
      try {
        const orderNumber = order?.order_number || 'Order';
        await supabase.from('notifications').insert([
          {
            title: isPartial ? 'Order Partially Delivered' : 'Order Delivered Successfully',
            message: isPartial
              ? `${orderNumber} delivered with partial quantities (${totalDelivered}/${totalOrdered} items). Notes: ${params.notes || 'None'}`
              : `${orderNumber} fully delivered to store by ${params.deliveryPersonName}.`,
            type: 'delivery',
            reference_type: 'orders',
            reference_id: params.orderId,
            is_read: false,
          },
        ]);
      } catch (nErr) {
        console.warn('Notification notice:', nErr);
      }

      return {
        success: true,
        isPartial,
        message: isPartial
          ? `Partial delivery recorded (${totalDelivered}/${totalOrdered} units). Admin has been updated.`
          : 'Order successfully marked as fully delivered!',
      };
    } catch (err: any) {
      console.error('Complete delivery error:', err);
      return {
        success: false,
        isPartial: false,
        message: err.message || 'Failed to complete delivery. Please retry.',
      };
    }
  },

  // ========================================================
  // 7. GET DASHBOARD METRICS FOR DELIVERY PILOT
  // ========================================================
  async getDashboardMetrics(deliveryPersonId: string): Promise<{
    totalAssigned: number;
    pendingPickup: number;
    outForDelivery: number;
    completedToday: number;
    partiallyDelivered: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select('id, status, assigned_date, completed_at')
        .eq('delivery_person_id', deliveryPersonId);

      if (error || !data) {
        return {
          totalAssigned: 0,
          pendingPickup: 0,
          outForDelivery: 0,
          completedToday: 0,
          partiallyDelivered: 0,
        };
      }

      let totalAssigned = 0;
      let pendingPickup = 0;
      let outForDelivery = 0;
      let completedToday = 0;
      let partiallyDelivered = 0;

      for (const item of data) {
        totalAssigned++;
        if (item.status === 'assigned') {
          pendingPickup++;
        } else if (item.status === 'in_transit') {
          outForDelivery++;
        } else if (item.status === 'delivered') {
          completedToday++;
        } else if (item.status === 'partially_delivered') {
          partiallyDelivered++;
        }
      }

      return {
        totalAssigned,
        pendingPickup,
        outForDelivery,
        completedToday,
        partiallyDelivered,
      };
    } catch {
      return {
        totalAssigned: 0,
        pendingPickup: 0,
        outForDelivery: 0,
        completedToday: 0,
        partiallyDelivered: 0,
      };
    }
  },
};

