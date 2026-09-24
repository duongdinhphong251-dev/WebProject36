import { redirect } from 'next/navigation';
import { api, type Deal, type Spa, type User } from '@/lib/api';
import { MutationButton } from '@/components/MutationButton';
import { LogoutButton } from '@/components/LogoutButton';

type Stats = { users: number; spas: number; vouchers: number };
export default async function Page() {
  const me = await api<User>('auth/me');
  if (me.role !== 'admin') redirect(me.role === 'spa_owner' ? '/owner' : '/me');
  const [users, spas, deals, stats] = await Promise.all([api<User[]>('admin/users'), api<Spa[]>('admin/spas'), api<Deal[]>('admin/deals'), api<Stats>('admin/stats')]);
  return <main className="container stack"><div className="row"><h1>Quản trị Nhom36</h1><LogoutButton /></div><p>{stats.users} tài khoản · {stats.spas} spa · {stats.vouchers} voucher</p>
    <h2>Spa chờ duyệt</h2>{spas.filter(spa => spa.approvalStatus === 'pending').map(spa => <div className="card row" key={spa.id}><strong>{spa.name}</strong><span>{spa.id}</span><MutationButton path={`admin/spas/${spa.id}/approval`} method="PATCH" body={{ status: 'approved' }}>Duyệt</MutationButton><MutationButton path={`admin/spas/${spa.id}/approval`} method="PATCH" body={{ status: 'rejected' }}>Từ chối</MutationButton></div>)}
    <h2>Voucher chờ duyệt</h2>{deals.filter(deal => deal.approvalStatus === 'pending').map(deal => <div className="card row" key={deal.id}><strong>{deal.titleVi}</strong><MutationButton path={`admin/deals/${deal.id}/approval`} method="PATCH" body={{ status: 'approved' }}>Duyệt</MutationButton><MutationButton path={`admin/deals/${deal.id}/approval`} method="PATCH" body={{ status: 'rejected' }}>Từ chối</MutationButton></div>)}
    <h2>Tài khoản</h2>{users.map(user => <div className="card row" key={user.id}><strong>{user.fullName}</strong><span>{user.phone} · {user.role} · {user.status}</span>{user.role !== 'admin' && <MutationButton path={`admin/users/${user.id}/status`} method="PATCH" body={{ status: user.status === 'banned' ? 'active' : 'banned' }}>{user.status === 'banned' ? 'Mở khóa' : 'Khóa'}</MutationButton>}</div>)}
    <h2>Tất cả spa</h2>{spas.map(spa => <div className="card" key={spa.id}>{spa.name} · {spa.approvalStatus}</div>)}
    <h2>Tất cả voucher</h2>{deals.map(deal => <div className="card" key={deal.id}>{deal.titleVi} · {deal.approvalStatus}</div>)}
  </main>;
}
