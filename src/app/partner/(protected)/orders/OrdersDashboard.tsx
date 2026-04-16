'use client';

// ── Partner orders dashboard (client orchestrator) ──────────────────────
//
// Loads orders for the current workspace, owns the filter tab + current
// selection, and wires the detail panel's status mutations back
// through `updateOrderStatusAction`. Presentational children live in
// their own files.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
  getPartnerOrdersAction,
  updateOrderStatusAction,
} from '@/actions/relay-orders';
import { getStatusLabel } from '@/lib/relay/order-helpers';
import type { OrderStatus, RelayOrder } from '@/lib/relay/order-types';
import StatsCard from './StatsCard';
import OrderRow from './OrderRow';
import OrderDetailPanel from './OrderDetailPanel';
import {
  STATUS_TABS,
  type OrderStatusFilter,
  type OrderTabIcon,
  nextStatusAfter,
} from './orders-constants';

function renderTabIcon(name: OrderTabIcon) {
  const size = 'h-4 w-4';
  switch (name) {
    case 'package':
      return <Package className={size} />;
    case 'clock':
      return <Clock className={size} />;
    case 'check':
      return <CheckCircle className={size} />;
    case 'refresh':
      return <RefreshCw className={size} />;
    case 'truck':
      return <Truck className={size} />;
  }
}

export default function OrdersDashboard() {
  const { user, currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
  const partnerId =
    currentWorkspace?.partnerId ||
    (user?.customClaims?.partnerId as string | undefined) ||
    '';

  const [orders, setOrders] = useState<RelayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<RelayOrder | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    const result = await getPartnerOrdersAction(partnerId, {
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 50,
    });
    if (result.success && result.orders) {
      setOrders(result.orders);
    } else {
      toast.error(result.error || 'Failed to load orders');
    }
    setLoading(false);
  }, [partnerId, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Keep the detail panel in sync with the latest list — if the selected
  // order got dropped by the filter, clear the selection.
  useEffect(() => {
    if (!selectedOrder) return;
    const match = orders.find((o) => o.id === selectedOrder.id);
    if (!match) setSelectedOrder(null);
    else if (match !== selectedOrder) setSelectedOrder(match);
  }, [orders, selectedOrder]);

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      if (!partnerId) return;
      setUpdating(orderId);
      const result = await updateOrderStatusAction(partnerId, orderId, newStatus);
      if (result.success && result.order) {
        toast.success(`Order updated to ${getStatusLabel(newStatus)}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (result.order as RelayOrder) : o)),
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(result.order);
        }
      } else {
        toast.error(result.error || 'Failed to update order');
      }
      setUpdating(null);
    },
    [partnerId, selectedOrder?.id],
  );

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) =>
        ['confirmed', 'processing'].includes(o.status),
      ).length,
      shipped: orders.filter((o) =>
        ['shipped', 'out_for_delivery'].includes(o.status),
      ).length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    }),
    [orders],
  );

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!partnerId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Please sign in to view orders.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer orders from Relay conversations.
          </p>
        </div>
        <Button onClick={() => void loadOrders()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard label="Total" value={stats.total} icon={<Package className="h-4 w-4" />} />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="h-4 w-4" />}
          color="yellow"
        />
        <StatsCard
          label="Processing"
          value={stats.processing}
          icon={<RefreshCw className="h-4 w-4" />}
          color="purple"
        />
        <StatsCard
          label="Shipped"
          value={stats.shipped}
          icon={<Truck className="h-4 w-4" />}
          color="blue"
        />
        <StatsCard
          label="Delivered"
          value={stats.delivered}
          icon={<CheckCircle className="h-4 w-4" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as OrderStatusFilter)}
              >
                <TabsList>
                  {STATUS_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="gap-1"
                    >
                      {renderTabIcon(tab.iconName)}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      selected={selectedOrder?.id === order.id}
                      onClick={() => setSelectedOrder(order)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedOrder ? (
            <OrderDetailPanel
              order={selectedOrder}
              partnerId={partnerId}
              nextStatus={nextStatusAfter(selectedOrder.status)}
              updating={updating === selectedOrder.id}
              onStatusUpdate={handleStatusUpdate}
              onTrackingUpdated={loadOrders}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ChevronRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select an order to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
