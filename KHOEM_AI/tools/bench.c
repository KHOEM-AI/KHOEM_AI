#include <stdio.h>
#include <time.h>
#define N 512
static float A[N*N],B[N*N],C[N*N];
int main(){
  for(int i=0;i<N*N;i++){A[i]=(i%7)*0.1f;B[i]=(i%5)*0.1f;C[i]=0;}
  struct timespec t0,t1; clock_gettime(CLOCK_MONOTONIC,&t0);
  int reps=10;
  for(int r=0;r<reps;r++)
    for(int i=0;i<N;i++) for(int k=0;k<N;k++){float a=A[i*N+k]; for(int j=0;j<N;j++) C[i*N+j]+=a*B[k*N+j];}
  clock_gettime(CLOCK_MONOTONIC,&t1);
  double s=(t1.tv_sec-t0.tv_sec)+(t1.tv_nsec-t0.tv_nsec)/1e9;
  printf("checksum=%f time=%.2fs GFLOPS=%.2f\n",C[12345],s,2.0*N*N*N*reps/s/1e9);
}
